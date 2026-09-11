import * as React from 'react';

import { cn } from '../ui/utils';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {}

const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('glass-card', className)} {...props} />
  ),
);
GlassSurface.displayName = 'GlassSurface';

export { GlassSurface };
