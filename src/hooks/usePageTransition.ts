import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useFullscreen } from '@/app/providers/FullscreenProvider';

export type PageView = 'main' | 'about';

type PageTransitionContextValue = {
  view: PageView;
  isAbout: boolean;
  direction: 1 | -1;
  transitionTo: (view: PageView) => void;
};

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

const WHEEL_THRESHOLD = 90;
const TOUCH_THRESHOLD = 72;
const WHEEL_RESET_DELAY = 650;
const TRANSITION_COOLDOWN = 550;

function getInitialView(): PageView {
  if (typeof window !== 'undefined' && window.location.hash === '#footer') {
    return 'about';
  }

  return 'main';
}

function replaceHash(hash: string | null) {
  if (typeof window === 'undefined') return;

  const nextUrl = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ''}`;
  window.history.replaceState({}, document.title, nextUrl);
}

function isGestureIgnored(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      '[data-modal-layer="true"], [data-page-transition-ignore="true"], input, textarea, select, [contenteditable="true"]',
    ),
  );
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const { isFullscreen } = useFullscreen();
  const [view, setView] = useState<PageView>(getInitialView);
  const [direction, setDirection] = useState<1 | -1>(1);
  const viewRef = useRef<PageView>(view);
  const wheelTotalRef = useRef(0);
  const wheelResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchTargetRef = useRef<EventTarget | null>(null);
  const cooldownUntilRef = useRef(0);
  const lastHashRef = useRef(typeof window !== 'undefined' ? window.location.hash : '');

  const transitionTo = useCallback((nextView: PageView) => {
    if (viewRef.current === nextView) return;

    setDirection(nextView === 'about' ? 1 : -1);
    viewRef.current = nextView;
    setView(nextView);

    if (nextView === 'about') {
      lastHashRef.current = '#footer';
      replaceHash('footer');
    } else if (window.location.hash === '#footer') {
      lastHashRef.current = '';
      replaceHash(null);
    }
  }, []);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const handleHashChange = () => {
      const nextHash = window.location.hash;
      const previousHash = lastHashRef.current;
      lastHashRef.current = nextHash;

      if (nextHash === '#footer') {
        transitionTo('about');
      } else if (!nextHash && previousHash === '#footer' && viewRef.current === 'about') {
        transitionTo('main');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [transitionTo]);

  useEffect(() => {
    const resetWheelTotal = () => {
      wheelTotalRef.current = 0;
      wheelResetTimerRef.current = null;
    };

    const handleWheel = (event: WheelEvent) => {
      if (
        isFullscreen ||
        document.fullscreenElement ||
        event.ctrlKey ||
        isGestureIgnored(event.target)
      ) {
        return;
      }

      event.preventDefault();

      const now = performance.now();
      if (now < cooldownUntilRef.current) return;

      wheelTotalRef.current += event.deltaY;
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
      wheelResetTimerRef.current = setTimeout(resetWheelTotal, WHEEL_RESET_DELAY);

      if (Math.abs(wheelTotalRef.current) < WHEEL_THRESHOLD) return;

      const nextView = wheelTotalRef.current > 0 ? 'about' : 'main';
      wheelTotalRef.current = 0;
      cooldownUntilRef.current = now + TRANSITION_COOLDOWN;
      transitionTo(nextView);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (
        isFullscreen ||
        document.fullscreenElement ||
        event.touches.length !== 1 ||
        isGestureIgnored(event.target)
      ) {
        touchStartYRef.current = null;
        touchTargetRef.current = null;
        return;
      }

      touchStartYRef.current = event.touches[0].clientY;
      touchTargetRef.current = event.target;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (touchStartYRef.current !== null && !isGestureIgnored(touchTargetRef.current)) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (touchStartYRef.current === null || isGestureIgnored(touchTargetRef.current)) {
        touchStartYRef.current = null;
        touchTargetRef.current = null;
        return;
      }

      const touch = event.changedTouches[0];
      const deltaY = touch ? touchStartYRef.current - touch.clientY : 0;
      touchStartYRef.current = null;
      touchTargetRef.current = null;

      if (Math.abs(deltaY) < TOUCH_THRESHOLD || performance.now() < cooldownUntilRef.current) {
        return;
      }

      cooldownUntilRef.current = performance.now() + TRANSITION_COOLDOWN;
      transitionTo(deltaY > 0 ? 'about' : 'main');
    };

    window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
    window.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, true);
      window.removeEventListener('touchstart', handleTouchStart, true);
      window.removeEventListener('touchmove', handleTouchMove, true);
      window.removeEventListener('touchend', handleTouchEnd, true);
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
    };
  }, [isFullscreen, transitionTo]);

  return createElement(
    PageTransitionContext.Provider,
    { value: { view, isAbout: view === 'about', direction, transitionTo } },
    children,
  );
}

export function usePageTransition(): PageTransitionContextValue {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }

  return context;
}
