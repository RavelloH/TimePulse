import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Timer } from '@/domain/timer';
import { useTheme } from '@/app/providers/ThemeProvider';
import { getCompactTimerItems, type CompactTimerItem } from './timerTabsLayout';

interface TimerTabsProps {
  timers: Timer[];
  activeTimerId: string | null;
  setActiveTimerId: (id: string) => void;
}

type CapsuleRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

const idleDelay = 5000;
const islandSpring = { type: 'spring', stiffness: 420, damping: 35, mass: 0.8 } as const;
const pillSpring = { type: 'spring', stiffness: 250, damping: 27, mass: 0.95 } as const;
const itemKey = (item: CompactTimerItem) => item.kind === 'timer' ? `timer-${item.timer.id}` : `overflow-${item.side}`;

function transformBetween(from: CapsuleRect, base: CapsuleRect): string {
  const dx = from.left + from.width / 2 - base.left - base.width / 2;
  const dy = from.top + from.height / 2 - base.top - base.height / 2;
  return `translate(${dx}px, ${dy}px) scale(${from.width / base.width}, ${from.height / base.height})`;
}

export default function TimerTabs({ timers, activeTimerId, setActiveTimerId }: TimerTabsProps) {
  const { accentColor } = useTheme();
  const reducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [expandedOrigin, setExpandedOrigin] = useState<{ activeId: string | null; items: CompactTimerItem[] } | null>(null);
  const [closingTarget, setClosingTarget] = useState<{ activeId: string | null; items: CompactTimerItem[] } | null>(null);
  const [handoffKeys, setHandoffKeys] = useState<Set<string>>(() => new Set());
  const [presenceEpoch, setPresenceEpoch] = useState(0);
  const [closingAccentColor, setClosingAccentColor] = useState<string | null>(null);
  const [isPointerIdle, setIsPointerIdle] = useState(true);
  const [pillOffsets, setPillOffsets] = useState<Map<string, number>>(new Map());
  const [activeOffset, setActiveOffset] = useState(0);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const compactRowRef = useRef<HTMLDivElement>(null);
  const compactWrapperRefs = useRef(new Map<string, HTMLDivElement>());
  const compactButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const timerButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const expandedSlotRefs = useRef(new Map<string, HTMLElement>());
  const closingSlotRefs = useRef(new Map<string, HTMLElement>());
  const closingOverflowRefs = useRef(new Map<string, HTMLButtonElement>());
  const expandedRef = useRef<HTMLDivElement>(null);
  const openingOriginsRef = useRef(new Map<string, CapsuleRect>());
  const openingAnimationsRef = useRef(new Map<string, Animation>());
  const closingAnimationsRef = useRef(new Map<string, Animation>());
  const closingRef = useRef(false);
  const closeFocusRef = useRef<{ restore: boolean; id: string | null }>({ restore: false, id: null });
  const menuId = useId();
  const activeIndex = Math.max(0, timers.findIndex((timer) => timer.id === activeTimerId));
  const activeTimer = timers[activeIndex];
  const solo = isPointerIdle && !isExpanded;
  const showDetailColors = isExpanded && !isClosing;
  const headerColor = closingAccentColor ?? accentColor;
  const layoutActiveId = expandedOrigin?.activeId ?? activeTimerId;
  const compactItems = expandedOrigin?.items ?? getCompactTimerItems(timers, activeTimerId, false);
  const compactItemKeys = compactItems.map(itemKey).join('|');
  const visibleTimerIds = new Set(compactItems.filter((item) => item.kind === 'timer').map((item) => item.timer.id));
  const closingVisibleIds = new Set(closingTarget?.items.filter((item) => item.kind === 'timer').map((item) => item.timer.id) ?? []);

  const compactRectFor = (timer: Timer): CapsuleRect | null => {
    const visible = compactItems.filter((item) => item.kind === 'timer');
    const firstIndex = timers.findIndex((item) => item.id === visible[0]?.timer.id);
    const timerIndex = timers.findIndex((item) => item.id === timer.id);
    const key = visibleTimerIds.has(timer.id)
      ? `timer-${timer.id}`
      : timerIndex < firstIndex ? 'overflow-left' : 'overflow-right';
    return (compactButtonRefs.current.get(key) ?? compactButtonRefs.current.get(`timer-${layoutActiveId}`))?.getBoundingClientRect() ?? null;
  };

  const openExpanded = () => {
    if (isExpanded || closingRef.current) return;
    setClosingAccentColor(null);
    setClosingTarget(null);
    openingOriginsRef.current.clear();
    for (const timer of timers) {
      const origin = compactRectFor(timer);
      if (origin) openingOriginsRef.current.set(timer.id, origin);
    }
    setExpandedOrigin({ activeId: activeTimerId, items: compactItems });
    setIsOpening(true);
    setIsExpanded(true);
  };

  useLayoutEffect(() => {
    const measure = () => {
      const row = compactRowRef.current;
      const activeWrapper = compactWrapperRefs.current.get(`timer-${layoutActiveId}`);
      if (!row || !activeWrapper) return;
      const activeCenter = activeWrapper.offsetLeft + activeWrapper.offsetWidth / 2;
      const next = new Map<string, number>();
      for (const [key, wrapper] of compactWrapperRefs.current) {
        next.set(key, wrapper.offsetLeft + wrapper.offsetWidth / 2 - activeCenter);
      }
      setPillOffsets(next);
      setActiveOffset(activeCenter - row.offsetWidth / 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (compactRowRef.current) observer.observe(compactRowRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [layoutActiveId, compactItemKeys]);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const handleMouseMove = (event: MouseEvent) => {
      const previous = lastPointerRef.current;
      if (previous?.x === event.clientX && previous.y === event.clientY) return;
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      setIsPointerIdle(false);
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIsPointerIdle(true), idleDelay);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isExpanded || closingRef.current) return;
    const finished: Promise<Animation>[] = [];
    for (const [index, timer] of timers.entries()) {
      const button = timerButtonRefs.current.get(timer.id);
      const slot = expandedSlotRefs.current.get(timer.id);
      const origin = openingOriginsRef.current.get(timer.id);
      if (!button || !slot || !origin) continue;
      const base = button.getBoundingClientRect();
      const destination = slot.getBoundingClientRect();
      const fromCompact = visibleTimerIds.has(timer.id);
      const animation = button.animate(
        fromCompact
          ? [
              { transform: transformBetween(origin, base), opacity: 1 },
              { transform: transformBetween(destination, base), opacity: 1 },
            ]
          : [
              { transform: transformBetween(origin, base), opacity: 0.35 },
              { transform: transformBetween(destination, base), opacity: 1 },
            ],
        {
          duration: reducedMotion ? 1 : 500,
          delay: reducedMotion ? 0 : Math.min(Math.abs(index - activeIndex) * 10, 70),
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        },
      );
      openingAnimationsRef.current.set(timer.id, animation);
      finished.push(animation.finished.catch(() => animation));
    }
    void Promise.all(finished).then(() => {
      if (!closingRef.current) setIsOpening(false);
    });
  }, [isExpanded]);

  useEffect(() => () => {
    for (const animation of openingAnimationsRef.current.values()) animation.cancel();
    for (const animation of closingAnimationsRef.current.values()) animation.cancel();
  }, []);

  useEffect(() => {
    if (!isExpanded && !isClosing && closingAccentColor?.toLowerCase() === accentColor.toLowerCase()) {
      setClosingAccentColor(null);
    }
  }, [accentColor, closingAccentColor, isClosing, isExpanded]);

  useEffect(() => {
    if (handoffKeys.size === 0) return;
    const frame = requestAnimationFrame(() => setHandoffKeys(new Set()));
    return () => cancelAnimationFrame(frame);
  }, [handoffKeys]);

  const closeExpanded = (nextActiveId?: string, restoreFocus = false) => {
    if (!isExpanded || closingRef.current) return;
    closingRef.current = true;
    const targetId = nextActiveId ?? activeTimerId;
    closeFocusRef.current = { restore: restoreFocus, id: targetId };
    setClosingTarget({ activeId: targetId, items: getCompactTimerItems(timers, targetId, false) });
    if (nextActiveId && nextActiveId !== activeTimerId) setActiveTimerId(nextActiveId);
    setClosingAccentColor(timers.find((timer) => timer.id === nextActiveId)?.color || accentColor);
    setIsClosing(true);
  };

  useLayoutEffect(() => {
    if (!isClosing || !closingTarget || closingAnimationsRef.current.size > 0) return;
    const currentRects = new Map<string, CapsuleRect>();
    const currentOpacities = new Map<string, number>();
    for (const [id, button] of timerButtonRefs.current) {
      currentRects.set(id, button.getBoundingClientRect());
      currentOpacities.set(id, Number(getComputedStyle(button).opacity));
    }
    for (const animation of openingAnimationsRef.current.values()) animation.cancel();
    openingAnimationsRef.current.clear();

    const finished: Promise<Animation>[] = [];
    const finalVisible = new Set(closingTarget.items.filter((item) => item.kind === 'timer').map((item) => item.timer.id));
    const firstVisibleId = closingTarget.items.find((item) => item.kind === 'timer')?.timer.id;
    const firstVisibleIndex = timers.findIndex((timer) => timer.id === firstVisibleId);
    const lastVisibleId = [...closingTarget.items].reverse().find((item) => item.kind === 'timer')?.timer.id;
    const lastVisibleIndex = timers.findIndex((timer) => timer.id === lastVisibleId);
    for (const timer of timers) {
      const button = timerButtonRefs.current.get(timer.id);
      const from = currentRects.get(timer.id);
      if (!button || !from) continue;
      const base = button.getBoundingClientRect();
      const timerIndex = timers.findIndex((item) => item.id === timer.id);
      const targetKey = finalVisible.has(timer.id)
        ? `timer-${timer.id}`
        : timerIndex < firstVisibleIndex ? 'overflow-left' : 'overflow-right';
      const destination = closingSlotRefs.current.get(targetKey)?.getBoundingClientRect();
      if (!destination) continue;
      const animation = button.animate(
        [
          { transform: transformBetween(from, base), opacity: currentOpacities.get(timer.id) ?? 1 },
          { transform: transformBetween(destination, base), opacity: finalVisible.has(timer.id) ? 1 : 0 },
        ],
        { duration: reducedMotion ? 1 : 420, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both' },
      );
      closingAnimationsRef.current.set(timer.id, animation);
      finished.push(animation.finished.catch(() => animation));
    }
    for (const side of ['left', 'right'] as const) {
      const key = `overflow-${side}`;
      const button = closingOverflowRefs.current.get(key);
      const sourceTimer = timers[side === 'left' ? firstVisibleIndex - 1 : lastVisibleIndex + 1];
      const from = sourceTimer && currentRects.get(sourceTimer.id);
      if (!button || !from) continue;
      const base = button.getBoundingClientRect();
      const animation = button.animate(
        [
          { transform: transformBetween(from, base), opacity: 0 },
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        ],
        { duration: reducedMotion ? 1 : 420, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both' },
      );
      closingAnimationsRef.current.set(key, animation);
      finished.push(animation.finished.catch(() => animation));
    }

    void Promise.all(finished).then(() => {
      flushSync(() => {
        for (const animation of closingAnimationsRef.current.values()) animation.cancel();
        closingAnimationsRef.current.clear();
        setHandoffKeys(new Set([...compactItems.map(itemKey), ...closingTarget.items.map(itemKey)]));
        setPresenceEpoch((epoch) => epoch + 1);
        setIsExpanded(false);
        setIsOpening(false);
        setIsClosing(false);
        setExpandedOrigin(null);
        setClosingTarget(null);
      });
      closingRef.current = false;
      if (closeFocusRef.current.restore) {
        requestAnimationFrame(() => timerButtonRefs.current.get(closeFocusRef.current.id ?? '')?.focus());
      }
    });
  }, [isClosing, closingTarget]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('[data-timer-island-pill="timer"]')) closeExpanded();
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded || isClosing || !activeTimer) return;
    const frame = requestAnimationFrame(() => timerButtonRefs.current.get(activeTimer.id)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [isExpanded, isClosing, activeTimerId]);

  const selectTimer = (timer: Timer) => {
    if (isExpanded) closeExpanded(timer.id, true);
    else if (timer.id !== activeTimerId) setActiveTimerId(timer.id);
  };

  const handleTimerKeyDown = (event: KeyboardEvent<HTMLButtonElement>, timer: Timer) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const index = timers.findIndex((item) => item.id === timer.id);
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = timers[(index + direction + timers.length) % timers.length];
      if (isExpanded) timerButtonRefs.current.get(next.id)?.focus();
      else setActiveTimerId(next.id);
    } else if (isExpanded && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      timerButtonRefs.current.get(event.key === 'Home' ? timers[0].id : timers[timers.length - 1].id)?.focus();
    }
  };

  if (!activeTimer) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[calc(50%-0.875rem)] z-30 hidden h-7 md:block"
      onKeyDown={(event) => {
        if (isExpanded && (event.key === 'Escape' || event.key === 'Tab')) {
          if (event.key === 'Escape') event.preventDefault();
          closeExpanded(undefined, event.key === 'Escape');
        }
      }}
    >
      <div
        className={`pointer-events-auto absolute top-0 z-10 ${solo ? 'left-1/2' : 'left-[calc(50%-4.75rem)] min-[900px]:left-[calc(50%-5.5rem)] xl:left-1/2'}`}
        style={{
          transform: `translateX(calc(-50% - ${solo ? activeOffset : 0}px))`,
          pointerEvents: isExpanded ? 'none' : 'auto',
          transition: reducedMotion ? 'none' : 'left 360ms cubic-bezier(.2,.8,.2,1), transform 420ms cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div ref={compactRowRef} role="group" aria-label="计时器" className="relative flex items-center justify-center gap-1 min-[900px]:gap-1.5">
          <AnimatePresence key={presenceEpoch} initial={false} mode="popLayout">
            {compactItems.map((item) => {
              const key = itemKey(item);
              const handoff = handoffKeys.has(key);
              const selected = item.kind === 'timer' && item.timer.id === activeTimerId;
              const hidden = solo && !selected;
              const offset = pillOffsets.get(key) ?? 0;
              const pillMotionStyle = {
                transform: hidden ? `translateX(${-offset}px) scale(0.55)` : 'translateX(0) scale(1)',
                opacity: hidden ? 0 : 1,
                filter: hidden ? 'blur(3px)' : undefined,
                pointerEvents: hidden || isClosing ? 'none' : 'auto',
                transition: reducedMotion || handoff ? 'none' : `transform 420ms cubic-bezier(.2,.8,.2,1), opacity 300ms ease, filter 360ms ease, background-color ${isExpanded ? (isClosing ? 420 : 500) : 200}ms ease, box-shadow 200ms ease, color 180ms ease`,
              } as const;
              if (item.kind === 'overflow') {
                return (
                  <motion.div
                    key={key}
                    ref={(node) => {
                      if (node) compactWrapperRefs.current.set(key, node);
                      else compactWrapperRefs.current.delete(key);
                    }}
                    layout={handoff ? false : 'position'}
                    initial={reducedMotion || handoff ? false : { opacity: 0, scale: 0.64 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={handoff ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.64, x: -offset }}
                    transition={reducedMotion || handoff ? { duration: 0 } : pillSpring}
                  >
                    <button
                      ref={(node) => {
                        if (node) compactButtonRefs.current.set(key, node);
                        else compactButtonRefs.current.delete(key);
                      }}
                      type="button"
                      tabIndex={hidden || isExpanded ? -1 : 0}
                      aria-hidden={hidden || isExpanded}
                      className="relative rounded-full px-2 py-1 text-sm font-medium text-gray-800 shadow-sm backdrop-blur-sm outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-sky-500 min-[900px]:px-2.5 dark:text-white"
                      aria-label={`${item.side === 'left' ? '左侧' : '右侧'}还有 ${item.count} 个计时器，展开全部`}
                      aria-haspopup="menu"
                      aria-controls={menuId}
                      aria-expanded={isExpanded}
                      onClick={openExpanded}
                      style={{
                        ...pillMotionStyle,
                        opacity: isExpanded ? 0 : pillMotionStyle.opacity,
                        pointerEvents: hidden || isExpanded ? 'none' : 'auto',
                        backgroundColor: `color-mix(in srgb, ${headerColor} 25%, transparent)`,
                      }}
                      data-insightflare-event="timer_list_expand"
                    >
                      <span aria-hidden="true" className="tracking-[-0.12em]">···</span>
                    </button>
                  </motion.div>
                );
              }

              const timer = item.timer;
              return (
                <motion.div
                  key={key}
                  ref={(node) => {
                    if (node) compactWrapperRefs.current.set(key, node);
                    else compactWrapperRefs.current.delete(key);
                  }}
                  layout={handoff ? false : 'position'}
                  initial={reducedMotion || handoff ? false : { opacity: 0, scale: 0.64 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={handoff ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.64, x: -offset }}
                  transition={reducedMotion || handoff ? { duration: 0 } : pillSpring}
                >
                  <button
                    ref={(node) => {
                      if (node) {
                        compactButtonRefs.current.set(key, node);
                        timerButtonRefs.current.set(timer.id, node);
                      } else {
                        compactButtonRefs.current.delete(key);
                        timerButtonRefs.current.delete(timer.id);
                      }
                    }}
                    type="button"
                    role={isExpanded ? 'menuitemradio' : undefined}
                    aria-checked={isExpanded ? selected : undefined}
                    aria-current={selected ? 'true' : undefined}
                    aria-hidden={hidden}
                    tabIndex={hidden ? -1 : 0}
                    title={timer.name}
                    data-timer-island-pill="timer"
                    className={`relative isolate max-w-[60px] truncate rounded-full px-2 py-1 text-sm font-medium whitespace-nowrap outline-none transition-[background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-sky-500 min-[900px]:max-w-24 min-[900px]:px-3 xl:max-w-40 ${selected ? 'text-white shadow-md hover:shadow-lg' : 'text-gray-800 shadow-sm backdrop-blur-sm hover:brightness-110 dark:text-white'}`}
                    style={{
                      ...pillMotionStyle,
                      backgroundColor: `color-mix(in srgb, ${showDetailColors ? timer.color || '#0ea5e9' : headerColor} 25%, transparent)`,
                    }}
                    onClick={() => selectTimer(timer)}
                    onKeyDown={(event) => handleTimerKeyDown(event, timer)}
                    data-insightflare-event="timer_switch"
                    data-insightflare-event-from={isExpanded ? 'desktop_expanded' : 'desktop_collapsed'}
                  >
                    {selected && (
                      <motion.span
                        layoutId="timer-island-active"
                        transition={reducedMotion || handoff ? { duration: 0 } : pillSpring}
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{
                          backgroundColor: showDetailColors ? timer.color || '#0ea5e9' : headerColor,
                          transition: reducedMotion ? 'none' : `background-color ${isExpanded ? (isClosing ? 420 : 500) : 200}ms ease`,
                        }}
                        aria-hidden="true"
                      />
                    )}
                    {selected && !reducedMotion && (
                      <motion.span
                        layoutId="timer-island-glow"
                        transition={handoff ? { duration: 0 } : islandSpring}
                        className="pointer-events-none absolute -inset-1 -z-10 rounded-full opacity-30 blur-md"
                        style={{
                          backgroundColor: showDetailColors ? timer.color || '#0ea5e9' : headerColor,
                          transition: reducedMotion ? 'none' : `background-color ${isExpanded ? (isClosing ? 420 : 500) : 200}ms ease`,
                        }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10">{timer.name}</span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {closingTarget && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-[calc(50%-4.75rem)] flex -translate-x-1/2 items-center justify-center gap-1 min-[900px]:left-[calc(50%-5.5rem)] min-[900px]:gap-1.5 xl:left-1/2"
        >
          {closingTarget.items.map((item) => {
            const key = itemKey(item);
            if (item.kind === 'overflow') {
              return (
                <button
                  key={key}
                  ref={(node) => {
                    if (node) {
                      closingSlotRefs.current.set(key, node);
                      closingOverflowRefs.current.set(key, node);
                    } else {
                      closingSlotRefs.current.delete(key);
                      closingOverflowRefs.current.delete(key);
                    }
                  }}
                  type="button"
                  tabIndex={-1}
                  className="rounded-full px-2 py-1 text-sm font-medium text-gray-800 shadow-sm backdrop-blur-sm min-[900px]:px-2.5 dark:text-white"
                  style={{ opacity: 0, backgroundColor: `color-mix(in srgb, ${headerColor} 25%, transparent)` }}
                >
                  <span className="tracking-[-0.12em]">···</span>
                </button>
              );
            }
            return (
              <span
                key={key}
                ref={(node) => {
                  if (node) closingSlotRefs.current.set(key, node);
                  else closingSlotRefs.current.delete(key);
                }}
                className="block max-w-[60px] truncate rounded-full px-2 py-1 text-sm font-medium whitespace-nowrap opacity-0 min-[900px]:max-w-24 min-[900px]:px-3 xl:max-w-40"
              >
                {item.timer.name}
              </span>
            );
          })}
        </div>
      )}

      {isExpanded && (
        <div
          ref={expandedRef}
          id={menuId}
          role="menu"
          aria-label="计时器"
          className="timer-island-scroll pointer-events-none absolute left-1/2 flex max-h-64 w-[min(860px,calc(100vw-32px))] -translate-x-1/2 flex-wrap items-center justify-center gap-2 py-2"
          style={{ top: 'calc(100% + 28px)', overflow: isOpening || isClosing ? 'visible' : undefined }}
        >
          {timers.map((timer) => {
            const selected = timer.id === activeTimerId;
            const inCompact = visibleTimerIds.has(timer.id);
            if (inCompact) {
              return (
                <span
                  key={timer.id}
                  ref={(node) => {
                    if (node) expandedSlotRefs.current.set(timer.id, node);
                    else expandedSlotRefs.current.delete(timer.id);
                  }}
                  aria-hidden="true"
                  className="pointer-events-none block max-w-44 truncate rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap opacity-0"
                >
                  {timer.name}
                </span>
              );
            }
            return (
              <button
                key={timer.id}
                ref={(node) => {
                  if (node) {
                    expandedSlotRefs.current.set(timer.id, node);
                    timerButtonRefs.current.set(timer.id, node);
                  } else {
                    expandedSlotRefs.current.delete(timer.id);
                    timerButtonRefs.current.delete(timer.id);
                  }
                }}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                title={timer.name}
                data-timer-island-pill="timer"
                className={`pointer-events-auto relative isolate max-w-44 truncate rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap outline-none transition-[background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-sky-500 ${selected ? 'text-white shadow-md hover:shadow-lg' : 'text-gray-800 shadow-sm backdrop-blur-sm hover:brightness-110 dark:text-white'}`}
                style={{
                  backgroundColor: isClosing && closingTarget?.activeId === timer.id && closingVisibleIds.has(timer.id)
                    ? headerColor
                    : showDetailColors
                      ? selected ? timer.color || '#0ea5e9' : `color-mix(in srgb, ${timer.color || '#0ea5e9'} 25%, transparent)`
                      : `color-mix(in srgb, ${headerColor} 25%, transparent)`,
                  opacity: 1,
                  pointerEvents: isClosing ? 'none' : 'auto',
                  transition: reducedMotion ? 'none' : `background-color ${isClosing ? 420 : 500}ms ease`,
                }}
                onClick={() => selectTimer(timer)}
                onKeyDown={(event) => handleTimerKeyDown(event, timer)}
                data-insightflare-event="timer_switch"
                data-insightflare-event-from="desktop_expanded"
              >
                {timer.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
