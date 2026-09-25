import { useCallback, useState } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { useTranslation } from '@/i18n/useTranslation';
import { AutoResizer } from '@/components/ui';
import { LinearDialogTransition } from '@/components/composed';
import { TimezoneDialogShell } from './TimezoneDialogShell';
import { TimezonePicker } from './TimezonePicker';
import {
  popularWorldClocks,
  timezoneAccentPalette,
  type TimezoneOption,
  type WorldClockPreset,
} from './timezone-data';

export type WorldClockSelection = {
  name: string;
  timezone: string;
  city: string;
  country: string;
  color: string;
  skipToColorStep: boolean;
};

type WorldClockSelectionModalProps = {
  onClose: () => void;
  onSelectWorldClock: (selection: WorldClockSelection) => void;
};

export default function WorldClockSelectionModal({
  onClose,
  onSelectWorldClock,
}: WorldClockSelectionModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [viewDirection, setViewDirection] = useState<1 | -1>(1);

  const setView = (nextShowAll: boolean): void => {
    setViewDirection(nextShowAll ? 1 : -1);
    setShowAll(nextShowAll);
  };

  const getTranslatedCity = useCallback((city: string, timezone: string): string => {
    const key = `timezone.${timezone.replace(/\//g, '_').replace(/\-/g, '_')}`;
    return t(key, city);
  }, [t]);

  const getTranslatedCountry = useCallback((country: string): string => {
    return t(`country.${country}`, country);
  }, [t]);

  const handleSelectPopular = useCallback((worldClock: WorldClockPreset): void => {
    const translatedCity = getTranslatedCity(worldClock.name, worldClock.timezone);
    onSelectWorldClock({
      name: `${translatedCity}${t('timer.time', '时间')}`,
      timezone: worldClock.timezone,
      city: translatedCity,
      country: getTranslatedCountry(worldClock.country),
      color: worldClock.color,
      skipToColorStep: false,
    });
  }, [getTranslatedCity, getTranslatedCountry, onSelectWorldClock, t]);

  const handleSelectTimezone = useCallback((timezone: TimezoneOption): void => {
    const randomColor = timezoneAccentPalette[Math.floor(Math.random() * timezoneAccentPalette.length)];
    const translatedCity = getTranslatedCity(timezone.city, timezone.timezone);

    onSelectWorldClock({
      name: `${translatedCity}${t('timer.time', '时间')}`,
      timezone: timezone.timezone,
      city: translatedCity,
      country: getTranslatedCountry(timezone.country),
      color: randomColor,
      skipToColorStep: false,
    });
  }, [getTranslatedCity, getTranslatedCountry, onSelectWorldClock, t]);

  return (
    <TimezoneDialogShell
      title={t('modal.addWorldClock.selectWorldClock', '选择世界时间')}
      onClose={onClose}
    >
      <AutoResizer initial={false} overflow="hidden">
        <LinearDialogTransition
          transitionKey={showAll ? 'worldclock-all' : 'worldclock-popular'}
          direction={viewDirection}
        >
          <div>
            {!showAll ? (
              <>
                <h3 className="text-lg font-medium pb-4">
                  {t('modal.addWorldClock.popularCities', '常用城市')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-x-hidden">
                  {popularWorldClocks.map((worldClock) => {
                    const translatedCity = getTranslatedCity(worldClock.name, worldClock.timezone);
                    const translatedCountry = getTranslatedCountry(worldClock.country);

                    return (
                      <button
                        type="button"
                        key={worldClock.id}
                        className="min-w-0 rounded-lg glass-card border border-transparent p-3 text-left transition-colors hover:border-primary-500/30 hover:bg-primary-500/10 active:bg-primary-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-primary-500/15"
                        onClick={() => handleSelectPopular(worldClock)}
                        data-insightflare-event="worldclock_preset_select"
                        data-insightflare-event-timezone={worldClock.timezone}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${worldClock.color}20`, color: worldClock.color, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                          >
                            <FiMapPin className="text-sm" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{translatedCity}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {translatedCountry}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-center">
                  <button
                    className="btn-glass-primary"
                    onClick={() => setView(true)}
                    data-insightflare-event="worldclock_view_all"
                  >
                    {t('modal.addWorldClock.viewMoreTimezones', '查看更多时区')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <TimezonePicker
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  onSelectTimezone={handleSelectTimezone}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    className="btn-glass-secondary"
                    onClick={() => setView(false)}
                  >
                    {t('modal.addWorldClock.backToPopular', '返回常用城市')}
                  </button>
                </div>
              </>
            )}
          </div>
        </LinearDialogTransition>
      </AutoResizer>
    </TimezoneDialogShell>
  );
}
