import { useEffect, useId } from 'react';
import { LinearDialogShell } from '@/components/composed';
import { Button } from '@/components/ui/button';

type StopwatchStopConfirmModalProps = {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  timerColor?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function StopwatchStopConfirmModal({
  title,
  description,
  cancelLabel,
  confirmLabel,
  timerColor,
  onCancel,
  onConfirm,
}: StopwatchStopConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <LinearDialogShell onClose={onCancel}>
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="mb-6">
          <h2 id={titleId} className="text-2xl font-semibold" style={{ color: timerColor }}>
            {title}
          </h2>
          <p id={descriptionId} className="mt-3 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="glassSecondary" onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </LinearDialogShell>
  );
}
