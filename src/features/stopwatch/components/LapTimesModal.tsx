import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useTranslation } from '@/i18n/useTranslation';
import type { Lap } from '@/domain/timer';

type LapTimesModalProps = { onClose: () => void; laps: Lap[]; timerColor?: string };

export default function LapTimesModal({ onClose, laps, timerColor }: LapTimesModalProps) {
  const { t, currentLang } = useTranslation();

  // Format milliseconds to time string
  const formatTimeFromMs = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const formatNumber = (num: number) => num.toString().padStart(2, '0');
    
    if (hours > 0) {
      return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
    }
    return `${formatNumber(minutes)}:${formatNumber(seconds)}`;
  };

  if (!laps || laps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-x-hidden overflow-y-auto py-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card w-full max-w-md m-4 p-6 rounded-2xl max-h-[90vh] overflow-x-hidden overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{t('lap.title')}</h2>
            <button
              className="p-2 rounded-full btn-glass-hover border border-white/10 dark:border-white/10"
              onClick={onClose}
            >
              <FiX className="text-xl" />
            </button>
          </div>
          
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('lap.noLaps')}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              className="btn-glass-secondary"
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-x-hidden overflow-y-auto py-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-md m-4 p-6 rounded-2xl max-h-[90vh] overflow-x-hidden overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: timerColor }}>
            {t('lap.title')}
          </h2>
          <button
            className="p-2 rounded-full btn-glass-hover border border-white/10 dark:border-white/10"
            onClick={onClose}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {laps.length} {t('lap.lapTime')}
        </div>

        <div className="space-y-2">
          {laps.slice().reverse().map((lap, index) => {
            const lapNumber = laps.length - index;
            const prevLap = lapNumber > 1 ? laps[lapNumber - 2] : null;
            const elapsedMs = lap.elapsedMs ?? lap.total ?? lap.time ?? 0;
            const previousElapsedMs = prevLap ? (prevLap.elapsedMs ?? prevLap.total ?? prevLap.time ?? 0) : 0;
            const intervalMs = prevLap ? elapsedMs - previousElapsedMs : elapsedMs;
            
            return (
              <motion.div
                key={lap.id}
                className="flex justify-between items-center p-3 rounded-lg border border-white/10 dark:border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="font-medium" style={{ color: timerColor }}>
                  {currentLang === 'en-US' ? `Lap ${lapNumber}` : `第 ${lapNumber} 段`}
                </span>
                <div className="flex space-x-4 text-sm">
                  <div className="text-right">
                    <div className="text-gray-400 text-xs">{t('lap.lapInterval')}</div>
                    <div className="font-mono">{formatTimeFromMs(intervalMs)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-xs">{t('lap.totalTime')}</div>
                    <div className="font-mono">{formatTimeFromMs(elapsedMs)}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="btn-glass-secondary"
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
