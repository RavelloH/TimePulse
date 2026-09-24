import { useState, useEffect } from 'react';
import type { CSSProperties, ChangeEvent, MouseEvent as ReactMouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMenu, FiX, FiSettings, FiMoon, FiSun, FiUser, FiMaximize, FiMinimize, FiEdit, FiSave, FiGlobe, FiPlus, FiShare2, FiImage } from 'react-icons/fi';
import type { Timer, TimerType } from '@/domain/timer';
import { useTimers } from '@/app/providers/TimerProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useFullscreen } from '@/app/providers/FullscreenProvider';
import { useTranslation } from '@/i18n/useTranslation';
import type { Language } from '@/i18n/types';
import { LoginModal } from '@/features/sync';
import { ShareModal } from '@/features/sharing';
import TimerCreationFlow from '@/features/timer-management/components/TimerCreationFlow';
import TimerTabs from '@/features/timer-management/components/TimerTabs';
import { HexColorPicker } from 'react-colorful';
import { AutoResizer, AutoTransition } from '@/components/ui';
import { LinearDialogTransition } from '@/components/composed';

type TimerUpdate = {
  name: string;
  color?: string;
  targetDate?: string;
};

type TimerEditState = {
  id: string;
  name: string;
  color?: string;
  type?: TimerType;
  targetDate?: string;
  targetTime?: string;
  isLimitedEdit?: boolean;
};

export default function Header() {
  const { timers, activeTimerId, setActiveTimerId, deleteTimer, updateTimer } = useTimers();
  const { theme, toggleTheme, accentColor } = useTheme();
  const { isFullscreen, isHeaderVisible, headerHideDelay, showHeader, hideHeader } = useFullscreen();
  const { t, changeLanguage } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState<TimerEditState | null>(null);
  const [manageDirection, setManageDirection] = useState<1 | -1>(1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isTimerCreationOpen, setIsTimerCreationOpen] = useState(false);
  // 打开登录模态框
  const openLoginModal = () => {
    setIsLoginOpen(true);
    if (window.location.hash !== '#login') {
      window.location.hash = 'login';
    }
  };

  // 处理全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`错误: 无法进入全屏模式: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    // 不需要手动设置 isFullscreen，Fullscreen API 会自动触发 fullscreenchange 事件更新状态
  };

  // 处理语言切换
  const switchLanguage = (lang: Language) => {
    changeLanguage(lang);
    setIsLanguageOpen(false);
  };

  // 开始编辑计时器
  const startEditTimer = (timer: Timer) => {
    setManageDirection(1);
    if (timer.type === 'countdown' || !timer.type) {
      // 倒计时可以编辑所有属性
      setEditingTimer({
        ...timer,
        targetDate: new Date(timer.targetDate).toISOString().substring(0, 10),
        targetTime: new Date(timer.targetDate).toTimeString().substring(0, 5)
      });
    } else {
      // 正计时和世界时钟只能编辑名字和颜色
      setEditingTimer({
        id: timer.id,
        name: timer.name,
        color: timer.color,
        type: timer.type,
        isLimitedEdit: true // 标记为限制编辑模式
      });
    }
  };

  // 保存编辑的计时器
  const saveEditedTimer = () => {
    if (!editingTimer) return;
    
    if (editingTimer.isLimitedEdit) {
      // 限制编辑模式：只更新名字和颜色
      updateTimer(editingTimer.id, {
        name: editingTimer.name,
        color: editingTimer.color
      });
    } else {
      // 完整编辑模式：更新所有属性（倒计时）
      const targetDateObj = new Date(`${editingTimer.targetDate}T${editingTimer.targetTime}`);
      
      updateTimer(editingTimer.id, {
        name: editingTimer.name,
        targetDate: targetDateObj.toISOString(),
        color: editingTimer.color
      });
    }
    
    setManageDirection(-1);
    setEditingTimer(null);
    setShowColorPicker(false);
  };

  // 全屏模式下监听鼠标移动，自动显示/隐藏顶部栏
  useEffect(() => {
    // 只在全屏模式下启用
    if (!isFullscreen) {
      return;
    }

    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseMove = () => {
      // 鼠标移动时立即显示 Header
      showHeader();

      // 清除之前的隐藏定时器
      if (hideTimer) {
        clearTimeout(hideTimer);
      }

      // 设置新的隐藏定时器
      hideTimer = setTimeout(() => {
        hideHeader();
      }, headerHideDelay);
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [isFullscreen, headerHideDelay, showHeader, hideHeader]);

  // 获取当前活动计时器
  const activeTimer = timers.find(timer => timer.id === activeTimerId) || null;

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40"
      initial={{ y: 0 }}
      animate={{
        y: isFullscreen && !isHeaderVisible ? '-100%' : 0,
        opacity: isFullscreen && !isHeaderVisible ? 0 : 1
      }}
      transition={{ duration: 0.3 }}
    >
      <nav className="glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between relative">
        {/* Logo - 增强渐变效果，使用较深的相似色 */}
        <motion.div 
          className="flex items-center justify-start z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 
            className="logo-gradient text-xl md:text-2xl font-bold font-display bg-clip-text text-transparent"
            style={{ '--logo-accent': accentColor } as CSSProperties}
          >
            <a href="https://timepulse.ravelloh.top/">TimePulse</a>
          </h1>
        </motion.div>

        <TimerTabs
          timers={timers}
          activeTimerId={activeTimerId}
          setActiveTimerId={setActiveTimerId}
        />
        {/* 右侧按钮组 */}
        <div className="flex items-center justify-end z-10">
          {/* 桌面端所有按钮 */}
          <div className="hidden md:flex items-center">
            {/* 添加计时器按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsTimerCreationOpen(true);
                if (window.location.hash !== '#add') {
                  window.location.hash = 'add';
                }
              }}
              data-insightflare-event="timer_create_open"
              data-insightflare-event-from="desktop"
            >
              <FiPlus className="text-xl" />
            </button>

            {/* 背景设置按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                if (window.location.hash !== '#background') {
                  window.location.hash = 'background';
                }
              }}
              data-insightflare-event="background_open"
            >
              <FiImage className="text-xl" />
            </button>

            {/* 分享按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsShareOpen(true);
                if (window.location.hash !== '#share') {
                  window.location.hash = 'share';
                }
              }}
              data-insightflare-event="share_open"
              data-insightflare-event-from="desktop"
            >
              <FiShare2 className="text-xl" />
            </button>

            {/* 全屏按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={toggleFullscreen}
              data-insightflare-event="fullscreen_toggle"
              data-insightflare-event-to={isFullscreen ? 'off' : 'on'}
            >
              {isFullscreen ? <FiMinimize className="text-xl" /> : <FiMaximize className="text-xl" />}
            </button>

            {/* 登录按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={openLoginModal}
              data-insightflare-event="login_open"
              data-insightflare-event-from="desktop"
            >
              <FiUser className="text-xl" />
            </button>

            {/* 主题切换 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={toggleTheme}
              data-insightflare-event="theme_toggle"
              data-insightflare-event-to={theme === 'dark' ? 'light' : 'dark'}
            >
              {theme === 'dark' ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
            </button>

            {/* 语言切换 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => setIsLanguageOpen(true)}
              data-insightflare-event="language_picker_open"
              data-insightflare-event-from="desktop"
            >
              <FiGlobe className="text-xl" />
            </button>

            {/* 设置按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsManageOpen(true);
                if (window.location.hash !== '#manage') {
                  window.location.hash = 'manage';
                }
              }}
              data-insightflare-event="manage_open"
              data-insightflare-event-from="desktop"
            >
              <FiSettings className="text-xl" />
            </button>
          </div>

          {/* 移动端只显示创建计时器和菜单按钮 */}
          <div className="flex items-center md:hidden">
            {/* 移动端创建计时器按钮 */}
            <button
              className="p-2 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsTimerCreationOpen(true);
                if (window.location.hash !== '#add') {
                  window.location.hash = 'add';
                }
              }}
              data-insightflare-event="timer_create_open"
              data-insightflare-event-from="mobile"
            >
              <FiPlus className="text-xl" />
            </button>

            {/* 移动端菜单按钮 */}
            <button
              className="p-2 ml-1 rounded-full btn-glass-hover text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-insightflare-event="mobile_menu_toggle"
            >
              {isMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>
      </nav>

      {/* 移动端下拉菜单 - 同样使用计时器的颜色和动画效果 */}
      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card mx-4 mt-2 p-4 md:hidden max-h-[70vh] overflow-y-auto"
          >
            {/* 功能按钮区域 - 分两行，每行两个，放在上面 */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t('header.functions')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* 第一行 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    toggleFullscreen();
                    setIsMenuOpen(false);
                  }}
                  data-insightflare-event="fullscreen_toggle"
                  data-insightflare-event-to={isFullscreen ? 'off' : 'on'}
                >
                  {isFullscreen ? <FiMinimize className="text-xl" /> : <FiMaximize className="text-xl" />}
                  <span className="text-xs ml-2 flex-1 text-right">{isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}</span>
                </button>

                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    toggleTheme();
                    setIsMenuOpen(false);
                  }}
                  data-insightflare-event="theme_toggle"
                  data-insightflare-event-to={theme === 'dark' ? 'light' : 'dark'}
                >
                  {theme === 'dark' ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.themeToggle')}</span>
                </button>

                {/* 第二行 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsLanguageOpen(true);
                    setIsMenuOpen(false);
                  }}
                  data-insightflare-event="language_picker_open"
                  data-insightflare-event-from="mobile"
                >
                  <FiGlobe className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.language')}</span>
                </button>

                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsManageOpen(true);
                    setIsMenuOpen(false);
                    if (window.location.hash !== '#manage') {
                      window.location.hash = 'manage';
                    }
                  }}
                  data-insightflare-event="manage_open"
                  data-insightflare-event-from="mobile"
                >
                  <FiSettings className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.settings')}</span>
                </button>
                
                {/* 添加"登录"按钮 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    openLoginModal();
                    setIsMenuOpen(false);
                  }}
                  data-insightflare-event="login_open"
                  data-insightflare-event-from="mobile"
                >
                  <FiUser className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.login')}</span>
                </button>
                
                {/* 添加"分享"按钮 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsShareOpen(true);
                    setIsMenuOpen(false);
                    if (window.location.hash !== '#share') {
                      window.location.hash = 'share';
                    }
                  }}
                  data-insightflare-event="share_open"
                  data-insightflare-event-from="mobile"
                >
                  <FiShare2 className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('timer.share')}</span>
                </button>

                {/* 背景设置按钮 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (window.location.hash !== '#background') {
                      window.location.hash = 'background';
                    }
                  }}
                  data-insightflare-event="background_open"
                >
                  <FiImage className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">背景设置</span>
                </button>

                {/* 全屏设置按钮 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (window.location.hash !== '#fullscreen-settings') {
                      window.location.hash = 'fullscreen-settings';
                    }
                  }}
                  data-insightflare-event="fullscreen_settings_open"
                >
                  <FiMaximize className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">全屏设置</span>
                </button>
              </div>
            </div>

            {/* 计时器选择区域 - 只有有滚动条时才显示，放在下面 */}
            {timers.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('header.timers')}</h3>
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                  {timers.map(timer => (
                    <motion.button
                      key={timer.id}
                      layout
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`px-4 py-2 rounded-lg text-left ${
                        activeTimerId === timer.id 
                          ? 'text-white' 
                          : 'bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'
                      }`}
                      style={
                        activeTimerId === timer.id 
                          ? { backgroundColor: timer.color || '#0ea5e9' } 
                          : {}
                      }
                      onClick={() => {
                        setActiveTimerId(timer.id);
                        setIsMenuOpen(false);
                      }}
                      data-insightflare-event="timer_switch"
                      data-insightflare-event-from="mobile_menu"
                    >
                      {timer.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 管理计时器弹窗 */}
      <AutoTransition portal transitionKey={isManageOpen ? 'manage-open' : 'manage-closed'} initial={false} type="fade">
        {isManageOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 p-4 backdrop-blur-sm flex items-center justify-center z-50 overflow-x-hidden overflow-y-auto"
            onClick={() => {
              setIsManageOpen(false);
              setEditingTimer(null);
              if (window.location.hash === '#manage') {
                window.location.hash = '';
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-x-hidden overflow-y-auto"
              onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-4">
                <h2 className="text-xl font-semibold">{t('header.manage')}</h2>
                <button
                  className="p-1 rounded-full btn-glass-hover cursor-pointer"
                  onClick={() => {
                    setIsManageOpen(false);
                    setEditingTimer(null);
                    if (window.location.hash === '#manage') {
                      window.location.hash = '';
                    }
                  }}
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <AutoResizer initial={false} overflow="hidden">
              <LinearDialogTransition transitionKey={editingTimer ? `editing-${editingTimer.id}` : 'timer-list'} direction={manageDirection}>
              {editingTimer ? (
                <div className="flex flex-col gap-4">
                  <h3 className="font-medium pb-2">
                    {editingTimer.isLimitedEdit ? t('modal.edit.editTimer') : t('modal.edit.editCountdown')}
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('modal.edit.name')}</label>
                    <input
                      type="text"
                      value={editingTimer.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingTimer({...editingTimer, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  {/* 只有倒计时可以编辑日期和时间 */}
                  {!editingTimer.isLimitedEdit && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('modal.edit.date')}</label>
                        <input
                          type="date"
                          value={editingTimer.targetDate}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingTimer({...editingTimer, targetDate: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">{t('modal.edit.time')}</label>
                        <input
                          type="time"
                          value={editingTimer.targetTime}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingTimer({...editingTimer, targetTime: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('modal.edit.color')}</label>
                    <div 
                      className="h-10 w-full rounded-lg cursor-pointer"
                      style={{ backgroundColor: editingTimer.color }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    ></div>
                    {showColorPicker && (
                      <div className="pt-2">
                        <HexColorPicker 
                          color={editingTimer.color} 
                          onChange={(color) => setEditingTimer({...editingTimer, color})} 
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      className="flex-1 btn-glass-secondary"
                      onClick={() => {
                        setManageDirection(-1);
                        setEditingTimer(null);
                      }}
                    >
                      {t('common.previous')}
                    </button>
                    <button
                      className="flex-1 btn-glass-primary flex items-center justify-center"
                      onClick={saveEditedTimer}
                      data-insightflare-event="timer_edit_save"
                    >
                      <FiSave className="mr-2" />
                      {t('modal.edit.saveChanges')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                  {timers.map(timer => (
                    <div 
                      key={timer.id}
                      className="flex items-center justify-between rounded-lg bg-white/30 p-3 hover:bg-white/50 dark:bg-black/30 dark:hover:bg-black/50"
                      style={{
                        borderLeft: `4px solid ${timer.color || '#0ea5e9'}`
                      }}
                    >
                      <div>
                        <h3 className="font-medium">{timer.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {timer.type === 'stopwatch' 
                            ? t('timer.stopwatch')
                            : timer.type === 'worldclock' 
                            ? `${timer.country || t('timer.worldClock')} - ${timer.timezone || ''}`
                            : new Date(timer.targetDate).toLocaleString()
                          }
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {/* 所有计时器都可以编辑名字和颜色 */}
                        <button
                          className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer"
                          onClick={() => startEditTimer(timer)}
                          data-insightflare-event="timer_edit_open"
                          data-insightflare-event-type={timer.type || 'countdown'}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
                          onClick={() => deleteTimer(timer.id)}
                          data-insightflare-event="timer_delete"
                          data-insightflare-event-type={timer.type || 'countdown'}
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-start pt-4">
                  <button
                    className="btn-glass-secondary"
                    onClick={() => {
                      setIsManageOpen(false);
                      setEditingTimer(null);
                      if (window.location.hash === '#manage') {
                        window.location.hash = '';
                      }
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
                </>
              )}
              </LinearDialogTransition>
              </AutoResizer>
            </motion.div>
          </motion.div>
        ) : null}
      </AutoTransition>

      {/* 语言切换弹窗 */}
      <AutoTransition portal transitionKey={isLanguageOpen ? 'language-open' : 'language-closed'} initial={false} type="fade">
        {isLanguageOpen ? (
                        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsLanguageOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-sm m-4 p-6 rounded-2xl"
              onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('header.selectLanguage')}</h2>
                <button
                  className="p-1 rounded-full btn-glass-hover cursor-pointer"
                  onClick={() => setIsLanguageOpen(false)}
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  className="w-full px-4 py-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 text-left transition-all cursor-pointer"
                  onClick={() => switchLanguage('zh-CN')}
                  data-insightflare-event="language_change"
                  data-insightflare-event-lang="zh-CN"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🇨🇳</span>
                    <div>
                      <div className="font-medium">{t('header.chinese')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('header.chineseSimplified')}</div>
                    </div>
                  </div>
                </button>

                <button
                  className="w-full px-4 py-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 text-left transition-all cursor-pointer"
                  onClick={() => switchLanguage('en-US')}
                  data-insightflare-event="language_change"
                  data-insightflare-event-lang="en-US"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🇺🇸</span>
                    <div>
                      <div className="font-medium">{t('header.english')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('header.englishUS')}</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex justify-start pt-4">
                <button className="btn-glass-secondary" onClick={() => setIsLanguageOpen(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AutoTransition>

      {/* 登录模态框 */}
      <AutoTransition portal transitionKey={isLoginOpen ? 'login-open' : 'login-closed'} initial={false} type="fade">
        {isLoginOpen ? (
          <LoginModal onClose={() => {
            setIsLoginOpen(false);
            if (window.location.hash === '#login') {
              window.location.hash = '';
            }
          }} />
        ) : null}
      </AutoTransition>

      <TimerCreationFlow
        open={isTimerCreationOpen}
        onOpenChange={setIsTimerCreationOpen}
      />

      {/* 分享模态框 */}
      <AutoTransition portal transitionKey={isShareOpen ? 'share-open' : 'share-closed'} initial={false} type="fade">
        {isShareOpen ? (
          <ShareModal onClose={() => {
            setIsShareOpen(false);
            if (window.location.hash === '#share') {
              window.location.hash = '';
            }
          }} />
        ) : null}
      </AutoTransition>
    </motion.header>
  );
}
