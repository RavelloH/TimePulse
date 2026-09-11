import { useCallback, useEffect, useState } from 'react';
import type { TimerType } from '@/domain/timer';
import { AutoTransition } from '@/components/ui';
import AddStopwatchModal from './AddStopwatchModal';
import AddTimerModal from './AddTimerModal';
import AddWorldClockModal from './AddWorldClockModal';
import TimerTypeModal from './TimerTypeModal';

type TimerCreationFlowProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Coordinates the three timer creation screens without changing their
 * existing markup, motion timing, or close semantics.
 */
export default function TimerCreationFlow({ open, onOpenChange }: TimerCreationFlowProps) {
  const [selectedType, setSelectedType] = useState<TimerType | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedType(null);
    }
  }, [open]);

  const close = useCallback(() => {
    setSelectedType(null);
    onOpenChange(false);
    if (window.location.hash === '#add') {
      window.location.hash = '';
    }
  }, [onOpenChange]);

  const selectType = useCallback((type: TimerType) => {
    setSelectedType(type);
  }, []);

  return (
    <>
      <AutoTransition portal transitionKey={open && selectedType === null ? 'timer-type-open' : 'timer-type-closed'} initial={false} type="fade">
        {open && selectedType === null ? (
          <TimerTypeModal onClose={close} onSelectType={selectType} />
        ) : null}
      </AutoTransition>

      <AutoTransition portal transitionKey={open && selectedType === 'countdown' ? 'countdown-open' : 'countdown-closed'} initial={false} type="fade">
        {open && selectedType === 'countdown' ? <AddTimerModal onClose={close} /> : null}
      </AutoTransition>

      <AutoTransition portal transitionKey={open && selectedType === 'stopwatch' ? 'stopwatch-open' : 'stopwatch-closed'} initial={false} type="fade">
        {open && selectedType === 'stopwatch' ? <AddStopwatchModal onClose={close} /> : null}
      </AutoTransition>

      <AutoTransition portal transitionKey={open && selectedType === 'worldclock' ? 'worldclock-open' : 'worldclock-closed'} initial={false} type="fade">
        {open && selectedType === 'worldclock' ? <AddWorldClockModal onClose={close} /> : null}
      </AutoTransition>
    </>
  );
}
