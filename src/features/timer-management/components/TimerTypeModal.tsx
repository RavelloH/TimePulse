import { motion } from 'framer-motion';
import { FiX, FiClock, FiPlayCircle, FiGlobe } from 'react-icons/fi';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import type { TimerType } from '@/domain/timer';

type TimerTypeModalProps = {
  onClose: () => void;
  onSelectType: (type: TimerType) => void;
  embedded?: boolean;
};

export default function TimerTypeModal({ onClose, onSelectType, embedded = false }: TimerTypeModalProps) {
  const { accentColor } = useTheme();
  const { t } = useTranslation();

  const timerTypes: Array<{
    id: TimerType;
    name: string;
    description: string;
    icon: typeof FiClock;
    color: string;
  }> = [
    {
      id: 'countdown',
      name: t('timer.countdown', '倒计时'),
      description: t('timer.countdownDesc', '设置目标时间，倒数到零'),
      icon: FiClock,
      color: '#FF4D4F',
    },
    {
      id: 'stopwatch',
      name: t('timer.stopwatch', '正计时'),
      description: t('timer.stopwatchDesc', '从零开始计时，记录经过时间'),
      icon: FiPlayCircle,
      color: '#52C41A',
    },
    {
      id: 'worldclock',
      name: t('timer.worldClock', '世界时间'),
      description: t('timer.worldClockDesc', '显示不同时区的当前时间'),
      icon: FiGlobe,
      color: '#1890FF',
    },
  ];

  const content = (
    <>
        <div className="flex justify-between items-center pb-6">
          <h2 className="text-2xl font-semibold">{t('timer.selectType', '选择计时器类型')}</h2>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="space-y-4">
          {timerTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-xl glass-card hover:bg-white/10 dark:hover:bg-black/10 transition-colors text-left"
                onClick={() => onSelectType(type.id)}
                data-insightflare-event="timer_type_select"
                data-insightflare-event-type={type.id}
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: type.color + '20', color: type.color }}
                  >
                    <IconComponent className="text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {type.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="pt-6 flex justify-start">
          <Button
            variant="glassSecondary"
            onClick={onClose}
          >
            {t('common.cancel', '取消')}
          </Button>
        </div>
    </>
  );

  if (embedded) return content;

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
        className="glass-card w-full max-w-md m-4 p-6 rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}
