import { memo, useCallback, useMemo, useState } from 'react';
import { FiMapPin, FiSearch } from 'react-icons/fi';
import { useTranslation } from '@/i18n/useTranslation';
import { allTimezones, getTimezoneAccentColor, type TimezoneOption } from './timezone-data';

type TimezonePickerBaseProps = {
  onSelectTimezone: (timezone: TimezoneOption) => void;
};

type TimezonePickerSearchProps =
  | { searchTerm: string; onSearchTermChange: (value: string) => void }
  | { searchTerm?: undefined; onSearchTermChange?: undefined };

type TimezonePickerProps = TimezonePickerBaseProps & TimezonePickerSearchProps;

type LocalizedTimezoneOption = TimezoneOption & {
  translatedCity: string;
  translatedCountry: string;
  accentColor: string;
  searchIndex: string;
};

type TimezoneOptionRowProps = {
  timezone: LocalizedTimezoneOption;
  onSelect: (timezone: TimezoneOption) => void;
};

const TimezoneOptionRow = memo(function TimezoneOptionRow({ timezone, onSelect }: TimezoneOptionRowProps) {
  return (
    <button
      type="button"
      className="flex min-w-0 items-center space-x-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left backdrop-blur-sm transition-colors hover:border-primary-500/30 hover:bg-primary-500/10 active:bg-primary-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/10 dark:bg-black/10 dark:hover:bg-primary-500/15"
      onClick={() => onSelect(timezone)}
      data-insightflare-event="timezone_select"
      data-insightflare-event-timezone={timezone.timezone}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${timezone.accentColor}20`, color: timezone.accentColor, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        <FiMapPin className="text-sm" />
      </div>
      <div className="min-w-0">
        <div className="font-medium truncate">{timezone.translatedCity}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {timezone.translatedCountry} - {timezone.timezone}
        </div>
      </div>
    </button>
  );
});

export function TimezonePicker({
  onSelectTimezone,
  searchTerm: controlledSearchTerm,
  onSearchTermChange: setControlledSearchTerm,
}: TimezonePickerProps) {
  const { t } = useTranslation();
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const searchTerm = controlledSearchTerm ?? localSearchTerm;
  const setSearchTerm = setControlledSearchTerm ?? setLocalSearchTerm;

  const localizedTimezones = useMemo<LocalizedTimezoneOption[]>(() => allTimezones.map((timezone) => {
    const translationKey = `timezone.${timezone.timezone.replace(/\//g, '_').replace(/\-/g, '_')}`;
    const translatedCity = t(translationKey, timezone.city);
    const translatedCountry = t(`country.${timezone.country}`, timezone.country);

    return {
      ...timezone,
      translatedCity,
      translatedCountry,
      accentColor: getTimezoneAccentColor(timezone.timezone),
      searchIndex: [
        translatedCity,
        translatedCountry,
        timezone.city,
        timezone.country,
        timezone.timezone,
      ].join('\n').toLowerCase(),
    };
  }), [t]);

  const filteredTimezones = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return localizedTimezones;
    return localizedTimezones.filter((timezone) => timezone.searchIndex.includes(searchLower));
  }, [localizedTimezones, searchTerm]);

  const handleSelectTimezone = useCallback((timezone: TimezoneOption): void => {
    onSelectTimezone(timezone);
  }, [onSelectTimezone]);

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('modal.timezone.search', '搜索城市或国家...')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredTimezones.map((timezone) => (
            <TimezoneOptionRow
              key={timezone.timezone}
              timezone={timezone}
              onSelect={handleSelectTimezone}
            />
          ))}
        </div>
      </div>
    </>
  );
}
