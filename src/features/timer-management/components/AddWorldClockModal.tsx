import { useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCheck, FiGlobe } from 'react-icons/fi';
import { HexColorPicker } from 'react-colorful';
import { useTimers } from '@/app/providers/TimerProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useTranslation } from '@/i18n/useTranslation';
import WorldClockSelectionModal from '@/features/world-clock/components/WorldClockSelectionModal';
import { AutoResizer, AutoTransition } from '@/components/ui';
import { LinearDialogTransition } from '@/components/composed';

// 世界时钟专用预设颜色
const worldClockColors = [
  '#1890FF', // 蓝色主题
  '#52C41A', // 绿色
  '#722ED1', // 紫色
  '#13C2C2', // 青色
  '#FA8C16', // 橙色
  '#FAAD14', // 黄色
  '#F759AB', // 玫红
  '#FF7A45', // 珊瑚红
  '#69C0FF', // 浅蓝
  '#95DE64', // 浅绿
  '#B37FEB', // 浅紫
  '#5CDBD3', // 蓝绿
  '#FFC069', // 浅橙黄
  '#85A5FF', // 浅蓝紫
  '#FF9C6E', // 浅橙
  '#FF85C0', // 浅粉
  '#36CFC9', // 明青
  '#FFC53D', // 金黄
  '#BFBFBF', // 灰色
  '#2F54EB'  // 深蓝
];

type AddWorldClockModalProps = {
  onClose: () => void;
  onBack?: () => void;
  embedded?: boolean;
};

type WorldClockFormData = {
  name: string;
  timezone: string;
  city: string;
  country: string;
  color: string;
};

type TimezoneSelection = Pick<WorldClockFormData, 'timezone' | 'city' | 'country'>;

export default function AddWorldClockModal({ onClose, onBack, embedded = false }: AddWorldClockModalProps) {
  const { addTimer } = useTimers();
  const { accentColor } = useTheme();
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: 选择时区, 2: 选择颜色, 3: 完成
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);

  const goToStep = (nextStep: number) => {
    setStepDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };
  
  const [formData, setFormData] = useState<WorldClockFormData>({
    name: '',
    timezone: '',
    city: '',
    country: '',
    color: worldClockColors[0],
  });
  
  // 处理表单输入变化
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 设置颜色
  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };
  
  // 处理时区选择
  const handleTimezoneSelect = (timezoneData: TimezoneSelection) => {
    setFormData(prev => ({
      ...prev,
      ...timezoneData
    }));
    setShowTimezoneModal(false);
    // 不自动跳转到下一步，让用户可以修改名称
  };
  
  // 提交表单
  const handleSubmit = () => {
    const timerData = {
      name: formData.name,
      type: 'worldclock' as const,
      timezone: formData.timezone,
      city: formData.city,
      country: formData.country,
      color: formData.color,
    };
    
    addTimer(timerData);
    goToStep(3); // 进入完成步骤
    
    // 2秒后关闭弹窗
    setTimeout(() => {
      onClose();
    }, 2000);
  };
  
  const stepContent = (
    <LinearDialogTransition transitionKey={`worldclock-step-${step}-${formData.timezone ? 'selected' : 'empty'}`} direction={stepDirection} initial={false}>
          <>
          {step === 1 && (
            <>
            <div className="flex justify-between items-center pb-6">
              <h2 className="text-2xl font-semibold">{t('modal.addWorldClock.create', '创建世界时间')}</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="pb-6">
              <button
                  className="w-full glass-card p-4 text-left flex items-center hover:bg-white/10 dark:hover:bg-black/10"
                  onClick={() => setShowTimezoneModal(true)}
                  data-insightflare-event="worldclock_open_picker"
                >
                  <FiGlobe className="mr-2 text-primary-500" />
                  <span>{t('modal.addWorldClock.selectTimezoneAndCity', '选择时区和城市')}</span>
                </button>
              </div>
              
              {formData.timezone && (
                <>
                  <div className="pb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      {t('modal.addWorldClock.selectedTimezone', '已选择时区')}
                    </h3>
                    <div className="text-blue-600 dark:text-blue-300">
                      <div className="font-medium">{formData.city}</div>
                      <div className="text-sm">{formData.country}</div>
                      <div className="text-xs text-gray-500">{formData.timezone}</div>
                    </div>
                  </div>
                  </div>
                  
                  <form className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">时间名称</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={`例如: ${formData.city}时间`}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        required
                      />
                    </div>
                  </form>
                </>
              )}
              
              <div className="pt-6 flex justify-between">
                <button
                  className="btn-glass-secondary"
                  onClick={onBack ?? onClose}
                >
                  {onBack ? t('common.previous', '上一步') : t('common.cancel', '取消')}
                </button>
                {formData.timezone && (
                  <button
                    className="btn-glass-primary"
                    onClick={() => goToStep(2)}
                    disabled={!formData.name}
                    data-insightflare-event="worldclock_step_color"
                  >
                    {t('common.next', '下一步')}
                  </button>
                )}
              </div>
            </>
          )}
          
          {step === 2 && (
            <>
            <div className="flex justify-between items-center pb-6">
                <h2 className="text-2xl font-semibold">{t('modal.addWorldClock.selectColor', '选择颜色')}</h2>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={onClose}
                >
                  <FiX className="text-xl" />
                </button>
              </div>
              
              <div className="flex justify-center pb-6">
                <div 
                  className="w-24 h-24 rounded-full"
                  style={{ backgroundColor: formData.color }}
                ></div>
              </div>
              
            <div className="pb-6">
              <HexColorPicker
                color={formData.color}
                onChange={handleColorChange}
                className="w-full"
              />
            </div>
              
              <div className="grid grid-cols-5 gap-2">
                {worldClockColors.map(color => (
                  <button
                    key={color}
                    className={`w-full aspect-square rounded-full ${formData.color === color ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    data-insightflare-event="worldclock_color_preset"
                    data-insightflare-event-color={color}
                  ></button>
                ))}
              </div>
              
              <div className="pt-6 flex justify-between">
                <button
                  className="btn-glass-secondary"
                  onClick={() => goToStep(1)}
                >
                  {t('common.previous', '上一步')}
                </button>
                <button
                  className="btn-glass-primary"
                  onClick={handleSubmit}
                  data-insightflare-event="worldclock_create_confirm"
                >
                  {t('common.create', '创建')}
                </button>
              </div>
            </>
          )}
          
          {step === 3 && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="pb-4">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500"
                >
                  <FiCheck className="text-3xl text-white" />
                </motion.div>
              </div>
              <h2 className="w-full pb-2 text-2xl font-semibold">世界时间已创建</h2>
              <p className="w-full text-gray-500 dark:text-gray-400">
                {formData.city}{t('timer.successfullyCreated', '时间已成功创建')}
              </p>
            </div>
          )}
          </>
    </LinearDialogTransition>
  );

  const content = (
    <>
      {embedded ? stepContent : <AutoResizer initial overflow="hidden">{stepContent}</AutoResizer>}
      
      {/* 时区选择弹窗 */}
      <AutoTransition portal transitionKey={showTimezoneModal ? 'worldclock-timezone-open' : 'worldclock-timezone-closed'} initial={false} type="fade">
      {showTimezoneModal ? (
        <WorldClockSelectionModal
          onClose={() => setShowTimezoneModal(false)}
          onSelectWorldClock={handleTimezoneSelect}
        />
      ) : null}
      </AutoTransition>
    </>
  );

  if (embedded) return content;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 p-4 flex items-center justify-center z-50 backdrop-blur-sm overflow-x-hidden overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-x-hidden overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}
