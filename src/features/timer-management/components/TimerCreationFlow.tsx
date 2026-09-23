import { useCallback, useEffect, useState } from 'react';
import type { TimerType } from '@/domain/timer';
import { AutoTransition } from '@/components/ui';
import {
  LinearDialogShell,
  LinearDialogTransition,
  type LinearDialogDirection,
} from '@/components/composed';
import AddStopwatchModal from './AddStopwatchModal';
import AddTimerModal from './AddTimerModal';
import AddWorldClockModal from './AddWorldClockModal';
import TimerTypeModal from './TimerTypeModal';

type TimerCreationFlowProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Coordinates the three timer creation screens inside one persistent dialog
 * frame. Only the frame's content changes as the linear flow advances.
 */
export default function TimerCreationFlow({ open, onOpenChange }: TimerCreationFlowProps) {
  const [selectedType, setSelectedType] = useState<TimerType | null>(null);
  const [direction, setDirection] = useState<LinearDialogDirection>(1);

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
    setDirection(1);
    setSelectedType(type);
  }, []);

  const goBackToTypeSelection = useCallback(() => {
    setDirection(-1);
    setSelectedType(null);
  }, []);

  const currentStep = selectedType ?? 'timer-type';

  return (
    <AutoTransition
      portal
      transitionKey={open ? 'timer-creation-open' : 'timer-creation-closed'}
      initial={open}
      type="fade"
    >
      {open ? (
        <LinearDialogShell onClose={close}>
          <LinearDialogTransition transitionKey={currentStep} direction={direction} initial={false}>
            {selectedType === null ? (
              <TimerTypeModal embedded onClose={close} onSelectType={selectType} />
            ) : selectedType === 'countdown' ? (
              <AddTimerModal embedded onClose={close} onBack={goBackToTypeSelection} />
            ) : selectedType === 'stopwatch' ? (
              <AddStopwatchModal embedded onClose={close} onBack={goBackToTypeSelection} />
            ) : (
              <AddWorldClockModal embedded onClose={close} onBack={goBackToTypeSelection} />
            )}
          </LinearDialogTransition>
        </LinearDialogShell>
      ) : null}
    </AutoTransition>
  );
}
