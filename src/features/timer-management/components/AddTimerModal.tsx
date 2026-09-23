import { useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCalendar, FiClock, FiGlobe, FiCheck } from 'react-icons/fi';
import { HexColorPicker } from 'react-colorful';
import { useTimers } from '@/app/providers/TimerProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useTranslation } from '@/i18n/useTranslation';
import CustomSelect from '@/components/composed/CustomSelect';
import TimezoneSelectionModal from '@/features/world-clock/components/TimezoneSelectionModal';
import { Button } from '@/components/ui/button';
import { AutoResizer, AutoTransition } from '@/components/ui';
import { LinearDialogTransition } from '@/components/composed';
import type { Holiday } from '@/domain/timer';

type AddTimerModalProps = {
  onClose: () => void;
  onBack?: () => void;
  embedded?: boolean;
};

type CountdownFormData = {
  name: string;
  targetDate: string;
  targetTime: string;
  timezone: string;
  color: string;
};

// 丰富的预设颜色选择
const presetColors = [
  '#FF4D4F', // 红色
  '#FA8C16', // 橙色
  '#FAAD14', // 黄色
  '#52C41A', // 绿色
  '#13C2C2', // 青色
  '#1890FF', // 蓝色
  '#722ED1', // 紫色
  '#EB2F96', // 粉色
  '#F759AB', // 玫红
  '#FF7A45', // 珊瑚红
  '#FFC53D', // 金黄
  '#BFBFBF', // 灰色
  '#69C0FF', // 浅蓝
  '#95DE64', // 浅绿
  '#FF9C6E', // 浅橙
  '#B37FEB', // 浅紫
  '#5CDBD3', // 蓝绿
  '#FF85C0', // 浅粉
  '#FFC069', // 浅橙黄
  '#85A5FF'  // 浅蓝紫
];

export default function AddTimerModal({ onClose, onBack, embedded = false }: AddTimerModalProps) {
  const { addTimer, holidaysList: rawHolidaysList } = useTimers();
  const holidaysList = rawHolidaysList;
  const { accentColor } = useTheme();
  const { t } = useTranslation();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHolidaysList, setShowHolidaysList] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [step, setStep] = useState(1); // 1: 基本信息, 2: 选择颜色, 3: 完成
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);

  const goToStep = (nextStep: number) => {
    setStepDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };
  
  // 随机选择一个预设颜色作为默认
  const randomColor = presetColors[Math.floor(Math.random() * presetColors.length)];
  
  const [formData, setFormData] = useState<CountdownFormData>({
    name: '',
    targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 默认明天
    targetTime: '00:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
  
  // 处理时区选择
  const handleTimezoneSelect = (timezone: string, _city: string, _country: string) => {
    setFormData(prev => ({ ...prev, timezone }));
    setShowTimezoneModal(false);
  };

  // 选择节假日
  const handleSelectHoliday = (holiday: Holiday) => {
    const date = new Date(holiday.date);
    setFormData({
      name: holiday.name,
      targetDate: date.toISOString().slice(0, 10),
      targetTime: date.toTimeString().slice(0, 5),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      color: holiday.color,
    });
    setShowHolidaysList(false);
  };
  
  // 提交表单
  const handleSubmit = () => {
    const targetDateObj = new Date(`${formData.targetDate}T${formData.targetTime}`);
    
    const timerData = {
      name: formData.name,
      type: 'countdown' as const,
      targetDate: targetDateObj.toISOString(),
      timezone: formData.timezone,
      color: formData.color,
    };
    
    // 添加计时器
    addTimer(timerData);
    goToStep(3); // 进入完成步骤
    
    // 3秒后关闭弹窗
    setTimeout(() => {
      onClose();
    }, 2000);
  };
  
  const stepContent = (
    <LinearDialogTransition transitionKey={`countdown-step-${step}`} direction={stepDirection} initial={false}>
        <>
        {step === 1 && (
          <>
            <div className="flex justify-between items-center pb-6">
              <h2 className="text-2xl font-semibold">{t('modal.countdown.create', '创建倒计时')}</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 pb-6">
              <button 
                className="w-full glass-card p-4 text-left flex items-center hover:bg-white/10 dark:hover:bg-black/10"
                onClick={() => setShowHolidaysList(!showHolidaysList)}
                data-insightflare-event="holiday_list_toggle"
              >
                <FiCalendar className="mr-2 text-primary-500" />
                <span>{t('modal.countdown.selectHoliday', '选择常用节假日')}</span>
              </button>
              
              {showHolidaysList && (
                <div className="bg-white/10 dark:bg-black/10 rounded-xl p-3 max-h-60 overflow-y-auto flex flex-col gap-2">
                  {holidaysList.map((holiday, index) => (
                    <button
                      key={index}
                      className="w-full rounded-lg p-2 flex items-center justify-between hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                      onClick={() => handleSelectHoliday(holiday)}
                      data-insightflare-event="holiday_select"
                      data-insightflare-event-holiday={holiday.name}
                    >
                      <span>{holiday.name}</span>
                      <span 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: holiday.color }}
                      ></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <form className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.countdown.name', '计时器名称')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('modal.countdown.namePlaceholder', '例如: 春节倒计时')}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.countdown.date', '目标日期')}</label>
                <div className="flex items-center">
                  <span className="absolute pl-3 text-gray-500 z-10"><FiCalendar /></span>
                  <input
                    type="date"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.countdown.time', '目标时间')}</label>
                <div className="flex items-center">
                  <span className="absolute pl-3 text-gray-500 z-10"><FiClock /></span>
                  <input
                    type="time"
                    name="targetTime"
                    value={formData.targetTime}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.timezone.title', '时区')}</label>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                  onClick={() => setShowTimezoneModal(true)}
                >
                  <div className="flex items-center">
                    <FiGlobe className="mr-2 text-gray-400" />
                    <span className="text-sm">
                      {formData.timezone === 'Asia/Shanghai' ? t('modal.timezone.chinaTime', '中国标准时间 (UTC+8)') :
                       formData.timezone === 'America/New_York' ? t('modal.timezone.eastTime', '美国东部时间') :
                       formData.timezone === 'Europe/London' ? t('modal.timezone.ukTime', '英国时间') :
                       formData.timezone === 'Europe/Paris' ? t('modal.timezone.centralEuropeTime', '欧洲中部时间') :
                       formData.timezone === 'Asia/Tokyo' ? t('modal.timezone.japanTime', '日本时间') :
                       formData.timezone}
                    </span>
                  </div>
                </button>
              </div>
            </form>
            
            <div className="pt-6 flex justify-between">
              <Button
                variant="glassSecondary"
                onClick={onBack ?? onClose}
              >
                {onBack ? t('common.previous', '上一步') : t('common.cancel', '取消')}
              </Button>
              <Button
                variant="glassPrimary"
                onClick={() => goToStep(2)}
                disabled={!formData.name || !formData.targetDate || !formData.targetTime}
                data-insightflare-event="countdown_step_color"
              >
                {t('common.next', '下一步')}
              </Button>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <div className="flex justify-between items-center pb-6">
              <h2 className="text-2xl font-semibold">{t('modal.countdown.selectColor', '选择颜色')}</h2>
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
              {presetColors.slice(0, 20).map(color => (
                <button
                  key={color}
                  className={`w-full aspect-square rounded-full ${formData.color === color ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  data-insightflare-event="countdown_color_preset"
                  data-insightflare-event-color={color}
                ></button>
              ))}
            </div>
            
            <div className="pt-6 flex justify-between">
              <Button
                variant="glassSecondary"
                onClick={() => goToStep(1)}
              >
                {t('common.previous', '上一步')}
              </Button>
              <Button
                variant="glassPrimary"
                onClick={handleSubmit}
                data-insightflare-event="countdown_create_confirm"
              >
                {t('common.create', '创建')}
              </Button>
            </div>
          </>
        )}
        
        {step === 3 && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="pb-4">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500"
              >
                <FiCheck className="text-3xl text-white" />
              </motion.div>
            </div>
            <h2 className="w-full pb-2 text-2xl font-semibold">{t('modal.countdown.created', '倒计时已创建')}</h2>
            <p className="w-full text-gray-500 dark:text-gray-400">{t('modal.countdown.createdDesc', '您的倒计时已成功创建')}</p>
          </div>
        )}
        </>
    </LinearDialogTransition>
  );

  const content = (
    <>
      {embedded ? stepContent : <AutoResizer initial overflow="hidden">{stepContent}</AutoResizer>}
      
      {/* 时区选择弹窗 */}
      <AutoTransition portal transitionKey={showTimezoneModal ? 'countdown-timezone-open' : 'countdown-timezone-closed'} initial={false} type="fade">
      {showTimezoneModal ? (
        <TimezoneSelectionModal
          onClose={() => setShowTimezoneModal(false)}
          onSelectTimezone={handleTimezoneSelect}
          title={t('modal.timezone.title', '选择时区')}
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
