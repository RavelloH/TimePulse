import type { ReactNode } from 'react';
import { AutoTransition } from '@/components/ui';
import { cn } from '@/components/ui/utils';

export type LinearDialogDirection = 1 | -1;

type LinearDialogTransitionProps = {
  transitionKey: string | number;
  direction: LinearDialogDirection;
  initial?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Content transition for a linear dialog chain. The dialog shell remains in
 * place; only the current step moves horizontally when advancing or going
 * back. Entering and leaving the whole dialog are still handled by its shell.
 */
export function LinearDialogTransition({
  transitionKey,
  direction,
  initial = false,
  className,
  children,
}: LinearDialogTransitionProps) {
  return (
    <AutoTransition
      transitionKey={transitionKey}
      initial={initial}
      presenceMode="wait"
      className={cn('relative flow-root overflow-hidden', className)}
      custom={direction}
      customVariants={{
        initial: (value: unknown) => ({ opacity: 0, x: value === 1 ? 24 : -24 }),
        animate: { opacity: 1, x: 0 },
        exit: (value: unknown) => ({ opacity: 0, x: value === 1 ? -24 : 24 }),
      }}
    >
      {children}
    </AutoTransition>
  );
}
