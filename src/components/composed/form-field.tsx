import * as React from 'react';

import { Label } from '../ui/label';
import { cn } from '../ui/utils';
import { AutoResizer } from '../ui/auto-resizer';
import { AutoTransition } from '../ui/auto-transition';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, label, description, error, htmlFor, required = false, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span aria-hidden className="ml-1 text-red-500">*</span> : null}
        </Label>
      ) : null}
      {children}
      <AutoResizer initial={false}>
        <AutoTransition transitionKey={error ? 'error' : description ? 'description' : 'empty'} initial={false} type="slideDown">
          {error ? (
            <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          ) : description ? (
            <p id={htmlFor ? `${htmlFor}-description` : undefined} className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          ) : null}
        </AutoTransition>
      </AutoResizer>
    </div>
  ),
);
FormField.displayName = 'FormField';

export { FormField };
