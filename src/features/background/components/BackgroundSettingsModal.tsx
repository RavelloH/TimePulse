import { useEffect, useState, type ChangeEvent, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiLink, FiMonitor, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import { useBackground } from '@/app/providers/BackgroundProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/app/providers/ThemeProvider';
import imageStorage from '@/services/imageStorage';
import { track, bucketFileSize } from '@/services/analytics';
import type { BackgroundMode } from '../settings';
import { AutoResizer, AutoTransition } from '@/components/ui';

type BackgroundSettingsModalProps = {
  onClose: () => void;
};

type BackgroundTab = 'url' | 'file' | 'preview';

type StoredImage = {
  url: string;
};

type BackgroundModeOption = {
  value: BackgroundMode;
  label: string;
  icon: typeof FiMonitor;
  description: string;
};

const getErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : String(error)
);

export default function BackgroundSettingsModal({ onClose }: BackgroundSettingsModalProps) {
  const { t: _t } = useTranslation();
  const { accentColor } = useTheme();
  const {
    customBackgroundId,
    backgroundMode,
    bgOpacity,
    blurAmount,
    setBackgroundMode,
    setBgOpacity,
    setBlurAmount,
    setCustomBackgroundId,
    clearCustomBackground,
  } = useBackground();

  const [activeTab, setActiveTab] = useState<BackgroundTab>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 加载当前背景用于预览
  useEffect(() => {
    const loadPreview = async (): Promise<void> => {
      if (customBackgroundId) {
        try {
          const imageData = await imageStorage.getImage(customBackgroundId) as StoredImage | null;
          if (imageData) {
            setPreviewUrl(imageData.url);
          }
        } catch (err: unknown) {
          console.error('加载预览失败:', err);
        }
      } else {
        setPreviewUrl(null);
      }
    };

    void loadPreview();
  }, [customBackgroundId]);

  // 处理 URL 上传
  const handleUrlUpload = async (): Promise<void> => {
    if (!imageUrl.trim()) {
      setError('请输入图片 URL');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const id = await imageStorage.saveImageFromUrl(imageUrl.trim());
      setCustomBackgroundId(id);
      setSuccess('背景图片设置成功！');
      setImageUrl('');
      setActiveTab('preview');
      track('background_set_url');

      // 3秒后自动关闭
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const id = await imageStorage.saveImage(file);
      setCustomBackgroundId(id);
      setSuccess('背景图片上传成功！');
      setActiveTab('preview');
      track('background_set_file', {
        size_bucket: bucketFileSize(file.size),
        mime: file.type || 'unknown',
      });

      // 3秒后自动关闭
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
      // 清空文件输入
      event.target.value = '';
    }
  };

  // 清除自定义背景
  const handleClearBackground = async (): Promise<void> => {
    if (customBackgroundId) {
      try {
        await imageStorage.deleteImage(customBackgroundId);
      } catch (err: unknown) {
        console.error('删除图片失败:', err);
      }
    }

    clearCustomBackground();
    setPreviewUrl(null);
    setSuccess('已清除自定义背景');
    track('background_clear');

    // 3秒后自动关闭
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // 背景模式选项
  const backgroundModes: BackgroundModeOption[] = [
    { value: 'cover', label: '覆盖', icon: FiMonitor, description: '铺满整个屏幕' },
    { value: 'contain', label: '包含', icon: FiEye, description: '完整显示图片' },
    { value: 'repeat', label: '重复', icon: FiLink, description: '平铺图片' },
  ];

  const handleContentClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 p-4 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-2xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={handleContentClick}
      >
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">背景设置</h2>
          <button
            className="p-2 rounded-full btn-glass-hover cursor-pointer"
            onClick={onClose}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex space-x-2 mb-6">
          <button
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'url'
                ? 'text-white'
                : 'bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20'
            }`}
            style={
              activeTab === 'url'
                ? { backgroundColor: accentColor }
                : {}
            }
            onClick={() => { setActiveTab('url'); track('background_tab_change', { tab: 'url' }); }}
          >
            <FiLink className="inline mr-2" />
            图片 URL
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'file'
                ? 'text-white'
                : 'bg-white/10 dark:bg:black/10 hover:bg-white/20 dark:hover:bg:black/20'
            }`}
            style={
              activeTab === 'file'
                ? { backgroundColor: accentColor }
                : {}
            }
            onClick={() => { setActiveTab('file'); track('background_tab_change', { tab: 'file' }); }}
          >
            <FiUpload className="inline mr-2" />
            上传文件
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'preview'
                ? 'text-white'
                : 'bg-white/10 dark:bg:black/10 hover:bg:white/20 dark:hover:bg:black/20'
            }`}
            style={
              activeTab === 'preview'
                ? { backgroundColor: accentColor }
                : {}
            }
            onClick={() => { setActiveTab('preview'); track('background_tab_change', { tab: 'preview' }); }}
          >
            <FiEye className="inline mr-2" />
            预览与调整
          </button>
        </div>

        {/* 错误提示 */}
        <AutoTransition transitionKey={error || 'background-no-error'} initial={false} type="slideDown">
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
            >
              {error}
            </motion.div>
          ) : null}
        </AutoTransition>

        {/* 成功提示 */}
        <AutoTransition transitionKey={success || 'background-no-success'} initial={false} type="slideDown">
          {success ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"
            >
              {success}
            </motion.div>
          ) : null}
        </AutoTransition>

        {/* URL 输入 Tab */}
        <AutoResizer initial={false}>
        <AutoTransition transitionKey={`background-tab-${activeTab}`} initial={false} type="crossFade">
        <>
        {activeTab === 'url' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">图片 URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setImageUrl(event.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                disabled={isUploading}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              支持 JPEG、PNG、GIF、WebP 格式。请确保图片 URL 支持跨域访问。
            </p>
            <button
              className="w-full py-3 rounded-lg font-medium text-white transition-colors cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
              onClick={handleUrlUpload}
              disabled={isUploading || !imageUrl.trim()}
            >
              {isUploading ? '加载中...' : '设置背景'}
            </button>
          </motion.div>
        )}

        {/* 文件上传 Tab */}
        {activeTab === 'file' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="background-file-input"
              />
              <label
                htmlFor="background-file-input"
                className="cursor-pointer flex flex-col items-center"
              >
                <FiUpload className="text-4xl mb-3 text-gray-400" />
                <p className="text-lg font-medium mb-1">点击上传图片</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  支持 JPEG、PNG、GIF、WebP 格式
                </p>
              </label>
            </div>
            {isUploading && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                上传中...
              </div>
            )}
          </motion.div>
        )}

        {/* 预览与调整 Tab */}
        {activeTab === 'preview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* 背景预览 */}
            <div>
              <label className="block text-sm font-medium mb-2">当前背景预览</label>
              <div
                className="w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative"
                style={{
                  backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                  backgroundSize: backgroundMode === 'repeat' ? 'auto' : backgroundMode,
                  backgroundPosition: 'center',
                  backgroundRepeat: backgroundMode === 'repeat' ? 'repeat' : 'no-repeat',
                  filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
                }}
              >
                {!previewUrl && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    未设置背景
                  </div>
                )}
                {/* 遮罩预览 */}
                {previewUrl && (
                  <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: bgOpacity }}
                  />
                )}
              </div>
            </div>

            {/* 背景模式选择 */}
            <div>
              <label className="block text-sm font-medium mb-3">背景模式</label>
              <div className="grid grid-cols-3 gap-3">
                {backgroundModes.map(mode => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.value}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        backgroundMode === mode.value
                          ? 'border-current'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      style={
                        backgroundMode === mode.value
                          ? { borderColor: accentColor, color: accentColor }
                          : {}
                      }
                      onClick={() => { setBackgroundMode(mode.value); track('background_mode_change', { mode: mode.value }); }}
                    >
                      <Icon className={`text-2xl mx-auto mb-2 ${
                        backgroundMode === mode.value ? '' : 'text-gray-400'
                      }`} />
                      <div className={`text-sm font-medium ${
                        backgroundMode === mode.value ? '' : ''
                      }`}>
                        {mode.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {mode.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 高斯模糊调节 */}
            <div>
              <label className="block text-sm font-medium mb-3">
                高斯模糊: {blurAmount}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={blurAmount}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setBlurAmount(parseInt(event.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: accentColor,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>无模糊</span>
                <span>轻微</span>
                <span>强烈</span>
              </div>
            </div>

            {/* 遮罩透明度调节 */}
            <div>
              <label className="block text-sm font-medium mb-3">
                遮罩透明度: {Math.round(bgOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgOpacity}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setBgOpacity(parseFloat(event.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: accentColor,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>透明</span>
                <span>半透明</span>
                <span>不透明</span>
              </div>
            </div>

            {/* 清除背景按钮 */}
            <button
              className="w-full py-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium cursor-pointer"
              onClick={handleClearBackground}
            >
              <FiTrash2 className="inline mr-2" />
              清除自定义背景
            </button>
          </motion.div>
        )}
        </>
        </AutoTransition>
        </AutoResizer>
      </motion.div>
    </motion.div>
  );
}
