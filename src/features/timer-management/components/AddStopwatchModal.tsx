import { useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCheck } from 'react-icons/fi';
import { HexColorPicker } from 'react-colorful';
import { useTimers } from '@/app/providers/TimerProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { AutoResizer, AutoTransition } from '@/components/ui';

// 正计时专用预设颜色
const stopwatchColors = [
  '#52C41A', // 绿色主题
  '#1890FF', // 蓝色
  '#722ED1', // 紫色
  '#13C2C2', // 青色
  '#FA8C16', // 橙色
  '#FAAD14', // 黄色
  '#F759AB', // 玫红
  '#FF7A45', // 珊瑚红
  '#95DE64', // 浅绿
  '#69C0FF', // 浅蓝
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

type AddStopwatchModalProps = {
  onClose: () => void;
};

type StopwatchFormData = {
  name: string;
  color: string;
};

export default function AddStopwatchModal({ onClose }: AddStopwatchModalProps) {
  const { addTimer } = useTimers();
  const { accentColor } = useTheme();
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: 基本信息, 2: 选择颜色, 3: 完成
  
  // 随机选择一个绿色系预设颜色作为默认
  const randomColor = stopwatchColors[Math.floor(Math.random() * 3)]; // 前3个是绿色系
  
  const [formData, setFormData] = useState<StopwatchFormData>({
    name: '',
    color: randomColor,
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
  
  // 提交表单
  const handleSubmit = () => {
    const timerData = {
      name: formData.name,
      type: 'stopwatch' as const,
      startTime: new Date().toISOString(), // 正计时记录开始时间
      color: formData.color,
      isRunning: true, // 创建后立即开始
    };
    
    addTimer(timerData);
    setStep(3); // 进入完成步骤
    
    // 2秒后关闭弹窗
    setTimeout(() => {
      onClose();
    }, 2000);
  };
  
  return (
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
        <AutoTransition transitionKey={`stopwatch-step-${step}`} initial={false} type="crossFade">
        <>
        {step === 1 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">{t('modal.addStopwatch.create', '创建正计时')}</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.addStopwatch.timerName', '计时器名称')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('modal.addStopwatch.namePlaceholder', '例如: 学习时间')}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  {t('modal.addStopwatch.description', '正计时说明')}
                </h3>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {t('modal.addStopwatch.descriptionText', '正计时将从零开始计算经过的时间，创建后会立即开始计时。您可以随时暂停和恢复计时。')}
                </p>
              </div>
            </form>
            
            <div className="mt-6 flex justify-between">
              <button
                className="btn-glass-secondary"
                onClick={onClose}
              >
                {t('common.cancel', '取消')}
              </button>
              <button
                className="btn-glass-primary"
                onClick={() => setStep(2)}
                disabled={!formData.name}
                data-insightflare-event="stopwatch_step_color"
              >
                {t('common.next', '下一步')}
              </button>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">{t('modal.addStopwatch.selectColor', '选择颜色')}</h2>
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
              {stopwatchColors.map(color => (
                <button
                  key={color}
                  className={`w-full aspect-square rounded-full ${formData.color === color ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  data-insightflare-event="stopwatch_color_preset"
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
                data-insightflare-event="stopwatch_create_confirm"
              >
                {t('modal.addStopwatch.createAndStart', '创建并开始')}
              </button>
            </div>
          </>
        )}
        
        {step === 3 && (
          <div className="py-8 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center"
            >
              <FiCheck className="text-white text-3xl" />
            </motion.div>
            <h2 className="text-2xl font-semibold mb-2">{t('timer.stopwatchCreated', '正计时已创建')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('timer.stopwatchStarted', '正计时已开始运行')}</p>
          </div>
        )}
        </>
        </AutoTransition>
        </AutoResizer>
      </motion.div>
    </motion.div>
  );
}
