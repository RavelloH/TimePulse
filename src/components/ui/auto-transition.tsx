import * as React from 'react';
import { AnimatePresence, motion, type TargetAndTransition } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from './utils';

export type TransitionType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'slideUp'
  | 'slideDown'
  | 'crossFade';

type TransitionVariant =
  | TargetAndTransition
  | ((custom: unknown) => TargetAndTransition);

export interface AutoTransitionProps
  extends Omit<
    React.ComponentProps<typeof motion.div>,
    | 'children'
    | 'className'
    | 'initial'
    | 'animate'
    | 'exit'
    | 'variants'
    | 'transition'
    | 'custom'
  > {
  children: React.ReactNode;
  className?: string;
  portal?: boolean;
  duration?: number;
  type?: TransitionType;
  initial?: boolean;
  custom?: unknown;
  transitionKey?: string | number;
  presenceMode?: 'sync' | 'wait' | 'popLayout';
  customVariants?: {
    initial?: TransitionVariant;
    animate?: TransitionVariant;
    exit?: TransitionVariant;
  };
}

const transitionVariants: Record<
  TransitionType,
  { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }
> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  crossFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

function getChildKey(children: React.ReactNode): string {
  if (!children) return 'empty';

  const firstChild = React.Children.toArray(children)[0];
  if (React.isValidElement(firstChild) && firstChild.key !== null) {
    return String(firstChild.key);
  }

  if (React.isValidElement(firstChild)) {
    const childType = firstChild.type;
    if (typeof childType === 'string') return childType;
    if (typeof childType === 'function') {
      return (
        (childType as { displayName?: string; name?: string }).displayName ||
        childType.name ||
        'component'
      );
    }
  }

  return typeof firstChild === 'string' || typeof firstChild === 'number'
    ? String(firstChild)
    : 'node';
}

export const AutoTransition = React.forwardRef<HTMLDivElement, AutoTransitionProps>(
  function AutoTransition(
    {
      children,
      className,
      portal = false,
      duration = 0.3,
      type = 'fade',
      initial = true,
      custom,
      transitionKey,
      presenceMode = 'wait',
      customVariants,
      ...motionProps
    },
    ref,
  ) {
    const [hasRendered, setHasRendered] = React.useState(initial);

    React.useEffect(() => {
      if (!hasRendered) setHasRendered(true);
    }, [hasRendered]);

    const key = transitionKey === undefined ? getChildKey(children) : String(transitionKey);
    const hasChildren = React.Children.count(children) > 0;
    const variants = customVariants ?? transitionVariants[type];
    const resolvedPresenceMode = type === 'crossFade' ? 'popLayout' : presenceMode;
    const { style: motionStyle, ...restMotionProps } = motionProps;
    const portalClassName = portal && !className?.split(/\s+/).includes('fixed') ? 'relative' : undefined;
    const transition = (
      <AnimatePresence mode={resolvedPresenceMode} custom={custom} initial={initial}>
        {hasChildren ? (
          <motion.div
            {...restMotionProps}
            ref={ref}
            key={key}
            className={cn(portalClassName, className)}
            data-modal-layer={portal ? 'true' : undefined}
            custom={custom}
            variants={variants}
            initial={hasRendered ? 'initial' : false}
            animate="animate"
            exit="exit"
            transition={{ duration }}
            style={portal ? { ...motionStyle, zIndex: 1000 } : motionStyle}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    );

    if (portal && typeof document !== 'undefined') {
      return createPortal(transition, document.body);
    }

    return transition;
  },
);

AutoTransition.displayName = 'AutoTransition';
