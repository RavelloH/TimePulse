import { motion, type Easing } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from './utils';

export interface AutoResizerProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  ease?: Easing | Easing[];
  initial?: boolean;
  animateWidth?: boolean;
  animateHeight?: boolean;
}

export function AutoResizer({
  children,
  className,
  duration = 0.3,
  ease = 'easeInOut',
  initial = false,
  animateWidth = false,
  animateHeight = true,
}: AutoResizerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number | 'auto'>(initial && animateHeight ? 0 : 'auto');
  const widthRef = useRef<number | 'auto'>(initial && animateWidth ? 0 : 'auto');
  const [height, setHeight] = useState<number | 'auto'>(heightRef.current);
  const [width, setWidth] = useState<number | 'auto'>(widthRef.current);
  const [hasMeasured, setHasMeasured] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;

    const measureContent = () => {
      const nextHeight = content.scrollHeight;
      const nextWidth = content.scrollWidth;

      if (animateHeight && heightRef.current !== nextHeight) {
        heightRef.current = nextHeight;
        setHeight(nextHeight);
      }
      if (animateWidth && widthRef.current !== nextWidth) {
        widthRef.current = nextWidth;
        setWidth(nextWidth);
      }
      setHasMeasured(true);
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

    const mutationObserver = typeof MutationObserver !== 'undefined'
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

  return (
    <motion.div
      className={cn(className)}
      style={{
        alignItems: animateWidth ? 'flex-start' : undefined,
        display: animateWidth ? 'inline-flex' : undefined,
        overflow: 'hidden',
      }}
      animate={{
        ...(animateHeight ? { height } : {}),
        ...(animateWidth ? { width } : {}),
      }}
      transition={{
        duration: initial || hasMeasured ? duration : 0,
        ease,
      }}
    >
      <div
        ref={contentRef}
        style={animateWidth ? { display: 'inline-block', flexShrink: 0, width: 'max-content' } : undefined}
      >
        {children}
      </div>
    </motion.div>
  );
}
