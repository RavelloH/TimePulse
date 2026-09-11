import * as React from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button, type ButtonProps } from '../ui/button';

export interface ConfirmDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  /** Aliases kept for call sites that use action-oriented copy. */
  confirmText?: React.ReactNode;
  cancelText?: React.ReactNode;
  onConfirm?: React.MouseEventHandler<HTMLButtonElement>;
  onCancel?: React.MouseEventHandler<HTMLButtonElement>;
  confirmProps?: Omit<ButtonProps, 'children' | 'onClick'>;
  cancelProps?: Omit<ButtonProps, 'children' | 'onClick'>;
}

const ConfirmDialog = ({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmProps,
  cancelProps,
  children,
  ...dialogProps
}: ConfirmDialogProps) => {
  const resolvedConfirmLabel = confirmLabel ?? confirmText ?? 'Confirm';
  const resolvedCancelLabel = cancelLabel ?? cancelText ?? 'Cancel';

  return (
    <Dialog {...dialogProps}>
      {trigger
        ? React.isValidElement(trigger)
          ? <DialogTrigger asChild>{trigger}</DialogTrigger>
          : <DialogTrigger>{trigger}</DialogTrigger>
        : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="glassSecondary" {...cancelProps} onClick={onCancel}>
              {resolvedCancelLabel}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="danger" {...confirmProps} onClick={onConfirm}>
              {resolvedConfirmLabel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
ConfirmDialog.displayName = 'ConfirmDialog';

export { ConfirmDialog };
