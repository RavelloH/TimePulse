import { motion, type Easing } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from './utils';

export interface AutoResizerProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  ease?: Easing | Easing[];
  initial?: boolean;
  animateWidth?: boolean;
  animateHeight?: boolean;
  collapsed?: boolean;
  repaintOnExpand?: boolean;
  overflow?: CSSProperties['overflow'];
}

export function AutoResizer({
  children,
  className,
  duration = 0.3,
  ease = 'easeInOut',
  initial = false,
  animateWidth = false,
  animateHeight = true,
  collapsed = false,
  repaintOnExpand = false,
  overflow = 'visible',
}: AutoResizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wasCollapsedRef = useRef(collapsed);
  const heightRef = useRef<number | 'auto'>(initial && animateHeight ? 0 : 'auto');
  const widthRef = useRef<number | 'auto'>(initial && animateWidth ? 0 : 'auto');
  const [height, setHeight] = useState<number | 'auto'>(heightRef.current);
  const [width, setWidth] = useState<number | 'auto'>(widthRef.current);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;

    const measureContent = () => {
      const nextHeight = content.scrollHeight;
      const nextWidth = content.scrollWidth;
      let changed = false;

      if (animateHeight && heightRef.current !== nextHeight) {
        heightRef.current = nextHeight;
        setHeight(nextHeight);
        changed = true;
      }
      if (animateWidth && widthRef.current !== nextWidth) {
        widthRef.current = nextWidth;
        setWidth(nextWidth);
        changed = true;
      }
      if (changed) setUpdateCount((count) => count + 1);
    };

    let frameId: number | null = null;
    const scheduleMeasure = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        measureContent();
      });
    };

    measureContent();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleMeasure)
      : null;
    resizeObserver?.observe(content);

    const mutationObserver = animateWidth && typeof MutationObserver !== 'undefined'
      ? new MutationObserver(scheduleMeasure)
      : null;
    mutationObserver?.observe(content, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [animateHeight, animateWidth]);

  useLayoutEffect(() => {
    const wasCollapsed = wasCollapsedRef.current;
    wasCollapsedRef.current = collapsed;

    if (!repaintOnExpand || !wasCollapsed || collapsed || overflow !== 'hidden') return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (!container.isConnected) return;

        // Some browsers fail to paint nested scrollers after revealing them
        // inside an animated, overflow-clipped container until overflow changes.
        container.style.overflow = 'visible';
        void container.offsetHeight;
        container.style.overflow = overflow;
        void container.offsetHeight;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [collapsed, overflow, repaintOnExpand]);

  const shouldAnimate = initial || updateCount > 1;

  return (
    <motion.div
      ref={containerRef}
      className={cn(className)}
      style={{
        alignItems: animateWidth ? 'flex-start' : undefined,
        display: animateWidth ? 'inline-flex' : undefined,
        overflow,
      }}
      animate={{
        ...(animateHeight ? { height: collapsed ? 0 : height } : {}),
        ...(animateWidth ? { width } : {}),
      }}
      transition={{
        duration: shouldAnimate ? duration : 0,
        ease,
      }}
    >
      <div
        ref={contentRef}
        style={
          animateWidth
            ? { display: 'inline-block', flexShrink: 0, width: 'max-content' }
            : { display: 'flow-root' }
        }
      >
        {children}
      </div>
    </motion.div>
  );
}
