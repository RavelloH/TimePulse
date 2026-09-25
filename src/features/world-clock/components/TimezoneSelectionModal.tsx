import { useCallback } from 'react';
import { TimezoneDialogShell } from './TimezoneDialogShell';
import { TimezonePicker } from './TimezonePicker';
import type { TimezoneOption } from './timezone-data';

type TimezoneSelectionModalProps = {
  onClose: () => void;
  onSelectTimezone: (timezone: string, city: string, country: string) => void;
  title?: string;
};

export default function TimezoneSelectionModal({
  onClose,
  onSelectTimezone,
  title = '选择时区',
}: TimezoneSelectionModalProps) {
  const handleSelectTimezone = useCallback((timezone: TimezoneOption) => {
    onSelectTimezone(timezone.timezone, timezone.city, timezone.country);
  }, [onSelectTimezone]);

  return (
    <TimezoneDialogShell title={title} onClose={onClose}>
      <TimezonePicker onSelectTimezone={handleSelectTimezone} />
    </TimezoneDialogShell>
  );
}
