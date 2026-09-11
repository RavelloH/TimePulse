import * as React from 'react';
import { Toast as ToastPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg backdrop-blur-xl transition-all data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-full',
  {
    variants: {
      variant: {
        default: 'border-white/20 bg-white/85 text-gray-900 dark:bg-gray-900/85 dark:text-gray-50',
        destructive: 'border-red-500/40 bg-red-500/15 text-red-900 dark:text-red-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn('fixed top-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:max-w-sm', className)}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName ?? 'ToastViewport';

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {}

const Toast = React.forwardRef<HTMLLIElement, ToastProps>(
  ({ className, variant, ...props }, ref) => (
    <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
  ),
);
Toast.displayName = ToastPrimitive.Root.displayName ?? 'Toast';

const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName ?? 'ToastTitle';

const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName ?? 'ToastDescription';

const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn('rounded-md border border-current/20 bg-transparent px-3 py-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10', className)}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName ?? 'ToastAction';

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('absolute right-2 top-2 rounded-md p-1 text-current/70 opacity-0 transition-opacity hover:text-current focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 group-hover:opacity-100', className)}
    data-toast-close=""
    {...props}
  >
    <span aria-hidden>×</span>
    <span className="sr-only">Close</span>
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName ?? 'ToastClose';

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toastVariants,
};
