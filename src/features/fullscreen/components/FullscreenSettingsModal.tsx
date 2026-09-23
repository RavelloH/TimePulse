import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiRotateCcw } from 'react-icons/fi';
import { useFullscreen } from '@/app/providers/FullscreenProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { track } from '@/services/analytics';
import type { FontSize } from '@/domain/settings';
import { AutoResizer, AutoTransition } from '@/components/ui';

type FullscreenSettingsModalProps = { onClose: () => void };

export default function FullscreenSettingsModal({ onClose }: FullscreenSettingsModalProps) {
  const { theme, accentColor } = useTheme();
  const { t } = useTranslation();
  const {
    headerHideDelay,
    timerFontSize,
    labelFontSize,
    setHeaderHideDelay,
    setTimerFontSize,
    setLabelFontSize,
    resetToDefaults
  } = useFullscreen();

  const [success, setSuccess] = useState(false);

  // 字体大小选项
  const fontSizes: Array<{ value: FontSize; label: string; description: string }> = [
    { value: 'small', label: '小', description: '紧凑显示' },
    { value: 'medium', label: '中', description: '标准大小' },
    { value: 'large', label: '大', description: '醒目显示' }
  ];

  // 隐藏延迟选项
  const delayOptions = [
    { value: 2000, label: '2 秒' },
    { value: 3000, label: '3 秒' },
    { value: 5000, label: '5 秒' }
  ];

  // 恢复默认设置
  const handleReset = () => {
    resetToDefaults();
    setSuccess(true);
    track('fullscreen_settings_reset');
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 p-4 backdrop-blur-sm flex items-center justify-center z-50 overflow-x-hidden overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md p-6 rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex justify-between items-center pb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">全屏设置</h2>
          <button
            className="p-2 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm cursor-pointer transition-colors border border-white/20 dark:border-white/10"
            onClick={onClose}
          >
            <FiX className="text-xl text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* 成功提示 */}
        <AutoResizer initial={false} overflow="hidden">
          <AutoTransition transitionKey={success ? 'fullscreen-success' : 'fullscreen-no-success'} initial={false} type="slideDown">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pb-4"
              >
                <div className="p-3 bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm text-green-600 dark:text-green-400 rounded-lg border border-green-200/50 dark:border-green-800/30">
                  已恢复默认设置
                </div>
              </motion.div>
            ) : null}
          </AutoTransition>
        </AutoResizer>

        <div className="space-y-6">
          {/* 计时器字体大小 */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">计时器字体大小</label>
            <div className="grid grid-cols-3 gap-3">
              {fontSizes.map(size => (
                <button
                  key={size.value}
                  className={`p-3 rounded-lg border-2 transition-all text-center backdrop-blur-sm ${
                    timerFontSize === size.value
                      ? 'border-current shadow-lg'
                      : 'border-gray-200/60 dark:border-white/10 hover:border-gray-300/60 dark:hover:border-white/20'
                  }`}
                  style={
                    timerFontSize === size.value
                      ? {
                          backgroundColor: accentColor + '20',
                          borderColor: accentColor,
                          color: accentColor
                        }
                      : {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'inherit'
                        }
                  }
                  onClick={() => { setTimerFontSize(size.value); track('fullscreen_settings_change', { field: 'timer_font_size', value: size.value }); }}
                >
                  <div className={`text-lg font-bold mb-1`}>
                    {size.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {size.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 标签字体大小 */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">标签字体大小</label>
            <div className="grid grid-cols-3 gap-3">
              {fontSizes.map(size => (
                <button
                  key={`label-${size.value}`}
                  className={`p-3 rounded-lg border-2 transition-all text-center backdrop-blur-sm ${
                    labelFontSize === size.value
                      ? 'border-current shadow-lg'
                      : 'border-gray-200/60 dark:border-white/10 hover:border-gray-300/60 dark:hover:border-white/20'
                  }`}
                  style={
                    labelFontSize === size.value
                      ? {
                          backgroundColor: accentColor + '20',
                          borderColor: accentColor,
                          color: accentColor
                        }
                      : {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'inherit'
                        }
                  }
                  onClick={() => { setLabelFontSize(size.value); track('fullscreen_settings_change', { field: 'label_font_size', value: size.value }); }}
                >
                  <div className={`text-lg font-bold mb-1`}>
                    {size.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {size.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 顶部栏隐藏延迟 */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">顶部栏自动隐藏延迟</label>
            <div className="grid grid-cols-3 gap-3">
              {delayOptions.map(delay => (
                <button
                  key={delay.value}
                  className={`p-3 rounded-lg border-2 transition-all text-center backdrop-blur-sm ${
                    headerHideDelay === delay.value
                      ? 'border-current shadow-lg'
                      : 'border-gray-200/60 dark:border-white/10 hover:border-gray-300/60 dark:hover:border-white/20'
                  }`}
                  style={
                    headerHideDelay === delay.value
                      ? {
                          backgroundColor: accentColor + '20',
                          borderColor: accentColor,
                          color: accentColor
                        }
                      : {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'inherit'
                        }
                  }
                  onClick={() => { setHeaderHideDelay(delay.value); track('fullscreen_settings_change', { field: 'header_hide_delay', value: delay.value }); }}
                >
                  <div className={`text-lg font-bold mb-1`}>
                    {delay.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    停止操作后
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              在全屏模式下，鼠标停止移动后多久自动隐藏顶部栏
            </p>
          </div>

          {/* 恢复默认按钮 */}
          <button
            className="w-full py-3 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300/60 dark:hover:border-white/20 transition-all font-medium cursor-pointer"
            onClick={handleReset}
          >
            <FiRotateCcw className="inline mr-2" />
            恢复默认设置
          </button>
        </div>

        <div className="flex justify-start pt-6">
          <button className="btn-glass-secondary" onClick={onClose}>
            {t('common.cancel', '取消')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
