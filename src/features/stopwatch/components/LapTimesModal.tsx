import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { useTimers } from '@/app/providers/TimerProvider';
import { useTranslation } from '@/i18n/useTranslation';
import type { Lap } from '@/domain/timer';

type LapTimesModalProps = {
  onClose: () => void;
  timerId: string;
  laps: Lap[];
  timerColor?: string;
};

export default function LapTimesModal({ onClose, timerId, laps, timerColor }: LapTimesModalProps) {
  const { renameStopwatchLap, deleteStopwatchLap } = useTimers();
  const { t, currentLang } = useTranslation();
  const [editingLapIndex, setEditingLapIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const getDefaultLapName = (index: number) => (
    currentLang === 'en-US' ? `Lap ${index + 1}` : `第 ${index + 1} 段`
  );

  const getLapName = (lap: Lap, index: number) => (
    typeof lap.name === 'string' && lap.name.trim() ? lap.name.trim() : getDefaultLapName(index)
  );

  const handleRename = (event: FormEvent<HTMLFormElement>, lapIndex: number) => {
    event.preventDefault();
    renameStopwatchLap(timerId, lapIndex, editingName.trim());
    setEditingLapIndex(null);
  };

  const handleDelete = (lapIndex: number) => {
    deleteStopwatchLap(timerId, lapIndex);
    setEditingLapIndex(null);
    if (laps.length === 1) onClose();
  };

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
        onClick={event => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: timerColor }}>
            {t('lap.title')}
          </h2>
          <button
            type="button"
            className="p-2 rounded-full btn-glass-hover border border-white/10 dark:border-white/10"
            onClick={onClose}
            aria-label={t('common.close', '关闭')}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {laps.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('lap.noLaps')}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {laps.length} {t('lap.lapTime')}
            </div>

            <div className="space-y-2">
              {laps.map((lap, originalIndex) => ({ lap, originalIndex })).reverse().map(({ lap, originalIndex }, index) => {
                const previousLap = originalIndex > 0 ? laps[originalIndex - 1] : null;
                const elapsedMs = lap.elapsedMs ?? lap.total ?? lap.time ?? 0;
                const previousElapsedMs = previousLap
                  ? previousLap.elapsedMs ?? previousLap.total ?? previousLap.time ?? 0
                  : 0;
                const intervalMs = elapsedMs - previousElapsedMs;
                const lapName = getLapName(lap, originalIndex);
                const isEditing = editingLapIndex === originalIndex;

                return (
                  <motion.div
                    key={lap.id ?? `${lap.timestamp ?? lap.createdAt ?? 'lap'}-${originalIndex}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-white/10 dark:border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      {isEditing ? (
                        <form
                          className="flex min-w-0 flex-1 items-center gap-2"
                          onSubmit={event => handleRename(event, originalIndex)}
                        >
                          <input
                            autoFocus
                            aria-label={t('lap.rename', '重命名分段')}
                            value={editingName}
                            onChange={event => setEditingName(event.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-black/10"
                          />
                          <button
                            type="submit"
                            className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-500/10 dark:text-green-400"
                            aria-label={t('lap.saveName', '保存名称')}
                            title={t('lap.saveName', '保存名称')}
                          >
                            <FiCheck />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/10 dark:hover:bg-black/10"
                            onClick={() => setEditingLapIndex(null)}
                            aria-label={t('common.cancel', '取消')}
                            title={t('common.cancel', '取消')}
                          >
                            <FiX />
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className="min-w-0 truncate font-medium" style={{ color: timerColor }}>
                            {lapName}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-800 dark:hover:bg-black/10 dark:hover:text-gray-200"
                              onClick={() => {
                                setEditingName(lapName);
                                setEditingLapIndex(originalIndex);
                              }}
                              aria-label={`${t('lap.rename', '重命名分段')} ${lapName}`}
                              title={t('lap.rename', '重命名')}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10 dark:text-red-400"
                              onClick={() => handleDelete(originalIndex)}
                              aria-label={`${t('lap.delete', '删除分段')} ${lapName}`}
                              title={t('lap.delete', '删除')}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex shrink-0 justify-end gap-4 text-sm">
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
          </>
        )}

        <div className="mt-6 flex justify-end">
          <button type="button" className="btn-glass-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
