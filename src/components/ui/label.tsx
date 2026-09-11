import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';

import { cn } from './utils';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none text-gray-800 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-100',
      className,
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName ?? 'Label';

export { Label };
