import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSave, FiShare2, FiCopy, FiCheck, FiDownload, FiUpload, FiWifiOff } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { saveSyncPayload, loadSyncPayload } from '@/services/sync';
import { useTimers } from '@/app/providers/TimerProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { AutoResizer, AutoTransition } from '@/components/ui';

type LoginModalProps = {
  onClose: () => void;
};

type PreventDefaultEvent = {
  preventDefault: () => void;
};

const getErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : String(error)
);

export default function LoginModal({ onClose }: LoginModalProps) {
  const { timers, activeTimerId, addTimer } = useTimers();
  const { accentColor: _accentColor } = useTheme();
  const { t } = useTranslation();
  const canUseSystemShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const [syncId, setSyncId] = useState('');
  const [syncUrl, setSyncUrl] = useState('');
  const [password, setPassword] = useState('');
  const [inputSyncId, setInputSyncId] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, generated, saved
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // 初始化 - 检查是否已有同步ID
  useEffect(() => {
    const savedSyncId = localStorage.getItem('timepulse_sync_id');
    const savedPassword = localStorage.getItem('timepulse_sync_password');
    
    if (savedSyncId) {
      setSyncId(savedSyncId);
      setStatus('saved');
      
      if (savedPassword) {
        setPassword(savedPassword);
      }
      
      // 生成同步URL
      const url = `${window.location.origin}${window.location.pathname}?syncId=${savedSyncId}${savedPassword ? `&syncPass=${savedPassword}` : ''}`;
      setSyncUrl(url);
    }
  }, []);
  
  // 检查网络状态
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    
    // 初始检查
    checkOnlineStatus();
    
    // 监听状态变化
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    
    // 清理
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);
  
  // 监听应用恢复在线状态
  useEffect(() => {
    const handleAppOnline = () => {
      // 当应用恢复在线状态时，自动获取最新数据
      if (syncId && password) {
        void loadFromRemote();
      }
    };
    
    window.addEventListener('appOnline', handleAppOnline);
    return () => window.removeEventListener('appOnline', handleAppOnline);
  }, [syncId, password]);
  
  // 生成新的同步ID和密码，并自动保存上传
  const generateSyncId = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const newSyncId = uuidv4();
    const newPassword = Math.random().toString(36).substring(2, 10); // 简单的密码生成
    
    setSyncId(newSyncId);
    setPassword(newPassword);
    
    try {
      // 保存到本地
      localStorage.setItem('timepulse_sync_id', newSyncId);
      localStorage.setItem('timepulse_sync_password', newPassword);
      
      // 生成同步URL
      const url = `${window.location.origin}${window.location.pathname}?syncId=${newSyncId}&syncPass=${newPassword}`;
      setSyncUrl(url);
      
      // 上传到远程
      await saveSyncPayload(newSyncId, newPassword, { timers, activeTimerId }, 30 * 24 * 60 * 60 * 1000);
      
      // 更新状态为已保存
      setStatus('saved');
      setSuccessMessage(t('login.generated'));
      console.log(`${t('login.syncIdSaved')}: ${newSyncId} - ${new Date().toLocaleString()}`);
    } catch (error: unknown) {
      setErrorMessage(`${t('login.generateError')}: ${getErrorMessage(error)}`);
      console.error('同步数据保存失败:', error);
      // 仍然显示生成的ID和密码，但状态为generated而非saved
      setStatus('generated');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 保存同步ID和密码到本地和远程
  const saveSyncId = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 先保存到本地
      localStorage.setItem('timepulse_sync_id', syncId);
      localStorage.setItem('timepulse_sync_password', password);
      
      // 然后保存到远程
      await saveSyncPayload(syncId, password, { timers, activeTimerId }, 30 * 24 * 60 * 60 * 1000);
      
      setStatus('saved');
      setSuccessMessage('同步数据已保存到云端');
      
      // 记录日志
      console.log(`${t('login.syncIdSaved')}: ${syncId} - ${new Date().toLocaleString()}`);
    } catch (error: unknown) {
      setErrorMessage(`保存失败: ${getErrorMessage(error)}`);
      console.error('同步数据保存失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 复制同步URL
  const copyUrl = () => {
    navigator.clipboard.writeText(syncUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err: unknown) => {
        setErrorMessage(`无法复制URL: ${getErrorMessage(err)}`);
        console.error('复制URL失败:', err);
      });
  };
  
  // 从远程加载数据
  const loadFromRemote = async (event?: PreventDefaultEvent) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const syncData = await loadSyncPayload(
        inputSyncId || syncId, 
        inputPassword || password
      );
      
      // 确保数据格式正确
      if (syncData && syncData.timers && Array.isArray(syncData.timers) && syncData.timers.length > 0) {
        // 导入计时器
        syncData.timers.forEach(timer => {
          addTimer(timer);
        });
        
        // 如果使用输入的ID，则保存为当前设备的同步ID
        if (inputSyncId) {
          localStorage.setItem('timepulse_sync_id', inputSyncId);
          localStorage.setItem('timepulse_sync_password', inputPassword);
          setSyncId(inputSyncId);
          setPassword(inputPassword);
          setStatus('saved');
          
          // 更新同步URL
          const url = `${window.location.origin}${window.location.pathname}?syncId=${inputSyncId}&syncPass=${inputPassword}`;
          setSyncUrl(url);
        }
        
        setSuccessMessage(`成功导入 ${syncData.timers.length} 个计时器`);
        console.log(`已从远程同步 ${syncData.timers.length} 个计时器 - ${new Date().toLocaleString()}`);
      } else {
        setErrorMessage('远程数据无效或不包含计时器');
      }
    } catch (error: unknown) {
      // 确保错误消息有意义
      const errorMsg = getErrorMessage(error) === '查询成功' ? '远程数据格式错误或为空' : getErrorMessage(error);
      setErrorMessage(`加载失败: ${errorMsg}`);
      console.error('从远程加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 上传当前数据到远程
  const uploadToRemote = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      await saveSyncPayload(
        syncId, 
        password, 
        { timers, activeTimerId }, 
        30 * 24 * 60 * 60 * 1000
      );
      
      setSuccessMessage(`成功上传 ${timers.length} 个计时器到云端`);
      console.log(`已上传 ${timers.length} 个计时器到远程 - ${new Date().toLocaleString()}`);
    } catch (error: unknown) {
      setErrorMessage(`上传失败: ${getErrorMessage(error)}`);
      console.error('上传数据到远程失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 p-4 flex items-center justify-center z-[600] backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{t('login.title')}</h2>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onClick={onClose}
          >
            <FiX className="text-xl" />
          </button>
        </div>
        
        <AutoResizer initial={false}>
        <AutoTransition
          transitionKey={`${status}-${showLogin ? 'login' : 'generate'}-${isOffline ? 'offline' : 'online'}-${errorMessage ? 'error' : 'no-error'}-${successMessage ? 'success' : 'no-success'}`}
          initial={false}
          type="crossFade"
        >
        <div className="flow-root">
        {/* 离线状态提示 */}
        {isOffline && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg flex items-center">
            <FiWifiOff className="mr-2 flex-shrink-0" />
            <span>您当前处于离线模式，同步功能不可用。请恢复网络连接后重试。</span>
          </div>
        )}
        
        {/* 错误和成功提示 */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
            {successMessage}
          </div>
        )}
        
        <div className="pb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('login.description')}
          </p>
          
          {/* 切换创建/登录选项卡 */}
          {status === 'idle' && (
            <div className="flex mb-4">
              <button
                className={`flex-1 py-2 border-b-2 ${!showLogin ? 'border-primary-500 text-primary-500' : 'border-gray-300 text-gray-500'}`}
                onClick={() => setShowLogin(false)}
              >
                {t('login.generateId')}
              </button>
              <button
                className={`flex-1 py-2 border-b-2 ${showLogin ? 'border-primary-500 text-primary-500' : 'border-gray-300 text-gray-500'}`}
                onClick={() => setShowLogin(true)}
              >
                {t('login.useExistingId')}
              </button>
            </div>
          )}
          
          {/* 创建同步ID */}
          {status === 'idle' && !showLogin && (
            <div className="flex justify-center">
              <button
                className="btn-glass-primary"
                onClick={generateSyncId}
                data-insightflare-event="sync_generate"
                disabled={isLoading}
              >
                {isLoading ? t('login.generating') : t('login.generateId')}
              </button>
            </div>
          )}
          
          {/* 登录同步ID */}
          {status === 'idle' && showLogin && (
            <form onSubmit={loadFromRemote} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('login.syncId')}</label>
                <input
                  type="text"
                  value={inputSyncId}
                  onChange={(e) => setInputSyncId(e.target.value)}
                  placeholder={t('login.syncIdPlaceholder', '输入您的同步ID')}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('login.password')}</label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder={t('login.password')}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full btn-glass-primary flex items-center justify-center"
                disabled={isLoading}
                data-insightflare-event="sync_login_submit"
              >
                <FiDownload className="mr-2" />
                {isLoading ? t('common.loading') : t('login.loginAndSync')}
              </button>
            </form>
          )}
          
          {/* 显示同步信息 */}
          {(status === 'generated' || status === 'saved') && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('login.yourSyncId', '您的同步ID')}</label>
                <div className="flex">
                  <input
                    type="text"
                    value={syncId}
                    readOnly
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  {status === 'generated' && (
                    <button
                      className="ml-2 btn-glass-primary"
                      onClick={saveSyncId}
                      data-insightflare-event="sync_save_id"
                      disabled={isLoading}
                    >
                      <FiSave />
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('login.passwordLabel', '密码')}</label>
                <div className="flex">
                  <input
                    type="text"
                    value={password}
                    readOnly
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('login.syncLink', '同步链接')}</label>
                <div className="flex">
                  <input
                    type="text"
                    value={syncUrl}
                    readOnly
                    className="flex-1 px-4 py-2 rounded-l-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <button
                    className={`btn-glass-primary rounded-r-lg rounded-l-none ${copied ? 'bg-green-500/30 border-green-500/40' : ''}`}
                    onClick={copyUrl}
                    data-insightflare-event="sync_link_copy"
                  >
                    {copied ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>
              </div>
              
              {status === 'saved' && (
                <div className="flex space-x-2">
                  <button
                    className={`flex-1 btn-glass-primary flex items-center justify-center ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={isOffline ? undefined : uploadToRemote}
                    data-insightflare-event="sync_upload"
                    disabled={isLoading || isOffline}
                  >
                    <FiUpload className="mr-2" />
                    {isLoading ? t('login.uploading', '上传中...') : t('login.uploadData', '上传当前数据')}
                  </button>
                  
                  <button
                    className={`flex-1 btn-glass-primary flex items-center justify-center ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={isOffline ? undefined : loadFromRemote}
                    data-insightflare-event="sync_download"
                    disabled={isLoading || isOffline}
                  >
                    <FiDownload className="mr-2" />
                    {isLoading ? t('login.downloading', '下载中...') : t('login.downloadData', '下载最新数据')}
                  </button>
                </div>
              )}
              
              <div className="flex justify-center mt-4">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG
                    value={syncUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              
              {status === 'saved' && (
                <div className="text-center text-green-500 font-medium">
                  ✓ {t('login.syncIdSaved', '同步ID已保存')}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
        </AutoTransition>
        </AutoResizer>
        
        <div className="flex space-x-4">
          <button
            className="flex-1 btn-glass-secondary flex items-center justify-center z-[650]"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.close', '关闭')}
          </button>
          <AutoTransition transitionKey={status !== 'idle' && canUseSystemShare ? 'login-system-share' : 'login-no-system-share'} initial={false} className="flex-1">
          {status !== 'idle' && canUseSystemShare ? (
            <button
              className="w-full btn-glass-primary flex items-center justify-center z-[650]"
              onClick={() => {
                navigator.share({
                  title: '登录到我的TimePulse',
                  text: '使用此链接登录并同步我的TimePulse倒计时',
                  url: syncUrl
                });
              }}
              data-insightflare-event="sync_link_share"
              disabled={isLoading}
            >
              <FiShare2 className="mr-2" />
              {t('login.shareButton', '分享')}
            </button>
          ) : null}
          </AutoTransition>
        </div>
      </motion.div>
    </motion.div>
  );
}
