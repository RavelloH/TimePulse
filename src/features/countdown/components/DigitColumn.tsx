import NumberFlow, { NumberFlowElement } from '@number-flow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';

type FontSize = 'small' | 'medium' | 'large';

type DigitColumnProps = {
  value: number;
  label: string;
  color?: string;
  fontSize?: FontSize;
  labelFontSize?: FontSize;
  cycleAtSixty?: boolean;
  trend: -1 | 1;
  isValueVisible: boolean;
};

const sixtyBasedDigits = {
  0: { max: 9 },
  1: { max: 5 },
};

const fontSizeClasses: Record<FontSize, string> = {
  small: 'text-4xl sm:text-5xl md:text-6xl',
  medium: 'text-5xl sm:text-6xl md:text-7xl',
  large: 'text-6xl sm:text-7xl md:text-8xl',
};

const labelFontSizeClasses: Record<FontSize, string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};

const labelSlotHeightClasses: Record<FontSize, string> = {
  small: 'h-5',
  medium: 'h-6',
  large: 'h-7',
};

const numberFlowTiming = {
  duration: 580,
  easing: NumberFlowElement.defaultProps.transformTiming.easing,
};

const numberFlowOpacityTiming = {
  duration: 580,
  easing: NumberFlowElement.defaultProps.opacityTiming.easing,
};

function DigitColumn({
  value,
  label,
  color = '#0ea5e9',
  fontSize = 'medium',
  labelFontSize = 'medium',
  cycleAtSixty = false,
  trend,
  isValueVisible,
}: DigitColumnProps) {
  const digitCount = Math.max(2, Math.abs(value).toString().length);
  const widthClass = digitCount >= 3
    ? 'w-24 sm:w-32 md:w-40'
    : 'w-20 sm:w-24 md:w-32';

  return (
    <motion.div
      layout="position"
      transition={{ layout: { type: 'tween', duration: 0.24, ease: 'easeOut' } }}
      className="flex flex-col items-center"
    >
      <motion.div
        className={`${widthClass} h-24 sm:h-32 md:h-36 rounded-xl glass-card flex items-center justify-center relative overflow-hidden`}
        style={{
          boxShadow: `0 0 30px ${color}20`,
          transition: 'width 0.24s ease-out, box-shadow 0.5s var(--transition-timing)',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          willChange: 'transform',
        }}
        whileHover={{
          boxShadow: `0 0 40px ${color}40`,
          scale: 1.02,
        }}
        transition={{ duration: 0.3 }}
      >
        <NumberFlow
          value={isValueVisible ? value : 0}
          format={{ minimumIntegerDigits: 2, useGrouping: false }}
          locales="en-US"
          transformTiming={numberFlowTiming}
          opacityTiming={numberFlowOpacityTiming}
          digits={cycleAtSixty ? sixtyBasedDigits : undefined}
          trend={trend}
          isolate
          className={`${fontSizeClasses[fontSize]} font-bold [--number-flow-mask-height:0.32em]`}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            color,
            transition: 'color 0.5s var(--transition-timing)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 0.85,
          }}
        />
      </motion.div>

      <div className={`relative mt-2 flex w-full items-center justify-center ${labelSlotHeightClasses[labelFontSize]}`}>
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={label}
            className={`absolute inset-x-0 whitespace-nowrap text-center ${labelFontSizeClasses[labelFontSize]} text-gray-500 dark:text-gray-400`}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            whileHover={{ color }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default memo(DigitColumn);
