import { useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCheck, FiGlobe } from 'react-icons/fi';
import { HexColorPicker } from 'react-colorful';
import { useTimers } from '@/app/providers/TimerProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useTranslation } from '@/i18n/useTranslation';
import WorldClockSelectionModal from '@/features/world-clock/components/WorldClockSelectionModal';
import { AutoResizer, AutoTransition } from '@/components/ui';

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
};

type WorldClockFormData = {
  name: string;
  timezone: string;
  city: string;
  country: string;
  color: string;
};

type TimezoneSelection = Pick<WorldClockFormData, 'timezone' | 'city' | 'country'>;

export default function AddWorldClockModal({ onClose }: AddWorldClockModalProps) {
  const { addTimer } = useTimers();
  const { accentColor } = useTheme();
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: 选择时区, 2: 选择颜色, 3: 完成
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  
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
    setStep(3); // 进入完成步骤
    
    // 2秒后关闭弹窗
    setTimeout(() => {
      onClose();
    }, 2000);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card w-full max-w-md m-4 p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <AutoResizer initial>
          <AutoTransition transitionKey={`worldclock-step-${step}-${formData.timezone ? 'selected' : 'empty'}`} initial={false} type="crossFade">
          <>
          {step === 1 && (
            <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">{t('modal.addWorldClock.create', '创建世界时间')}</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <FiX className="text-xl" />
              </button>
            </div>              <div className="mb-6">
                <button 
                  className="w-full glass-card p-4 mb-4 text-left flex items-center hover:bg-white/10 dark:hover:bg-black/10"
                  onClick={() => setShowTimezoneModal(true)}
                  data-insightflare-event="worldclock_open_picker"
                >
                  <FiGlobe className="mr-2 text-primary-500" />
                  <span>{t('modal.addWorldClock.selectTimezoneAndCity', '选择时区和城市')}</span>
                </button>
              </div>
              
              {formData.timezone && (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      {t('modal.addWorldClock.selectedTimezone', '已选择时区')}
                    </h3>
                    <div className="text-blue-600 dark:text-blue-300">
                      <div className="font-medium">{formData.city}</div>
                      <div className="text-sm">{formData.country}</div>
                      <div className="text-xs text-gray-500">{formData.timezone}</div>
                    </div>
                  </div>
                  
                  <form className="space-y-4">
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
              
              <div className="mt-6 flex justify-between">
                <button
                  className="btn-glass-secondary"
                  onClick={onClose}
                >
                  {t('common.cancel', '取消')}
                </button>
                {formData.timezone && (
                  <button
                    className="btn-glass-primary"
                    onClick={() => setStep(2)}
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">{t('modal.addWorldClock.selectColor', '选择颜色')}</h2>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={onClose}
                >
                  <FiX className="text-xl" />
                </button>
              </div>
              
              <div className="flex justify-center mb-6">
                <div 
                  className="w-24 h-24 rounded-full"
                  style={{ backgroundColor: formData.color }}
                ></div>
              </div>
              
              <HexColorPicker 
                color={formData.color} 
                onChange={handleColorChange} 
                className="w-full mb-6"
              />
              
              <div className="grid grid-cols-5 gap-2 mb-6">
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
              
              <div className="mt-6 flex justify-between">
                <button
                  className="btn-glass-secondary"
                  onClick={() => setStep(1)}
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
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center"
              >
                <FiCheck className="text-white text-3xl" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">世界时间已创建</h2>
              <p className="text-gray-500 dark:text-gray-400">
                {formData.city}{t('timer.successfullyCreated', '时间已成功创建')}
              </p>
            </div>
          )}
          </>
          </AutoTransition>
          </AutoResizer>
        </motion.div>
      </motion.div>
      
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
}
