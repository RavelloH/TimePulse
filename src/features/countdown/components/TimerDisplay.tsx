import { Fragment, useState, useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useTimers } from '@/app/providers/TimerProvider';
import { useFullscreen } from '@/app/providers/FullscreenProvider';
import { useTranslation } from '@/i18n/useTranslation';
import DigitColumn from './DigitColumn';
import { addNotification } from '@/services/notificationManager';
import { track, bucketDurationMs } from '@/services/analytics';
import { FiPlay, FiPause, FiSquare, FiFlag, FiList } from 'react-icons/fi';
import LapTimesModal from '@/features/stopwatch/components/LapTimesModal';
import {
  getTimerType,
  type CountdownTimer,
  type Lap,
  type StopwatchTimer,
  type Timer,
  type TimerType,
  type TimeValue,
  type WorldClockTimer,
} from '@/domain/timer';
import { getNextTimerUpdateDelay } from '../timerSchedule';
import { AutoResizer, AutoTransition, type TransitionType } from '@/components/ui';

type DisplayTime = {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type FontSize = 'small' | 'medium' | 'large';
type StopwatchAction = 'play' | 'pause' | 'stop' | 'lap';

const toDate = (value: TimeValue | null | undefined): Date => {
  if (value instanceof Date) return new Date(value.getTime());
  if (value === null) return new Date(0);
  return new Date(value ?? Number.NaN);
};

type AnimatedRegionProps = {
  children: ReactNode;
  transitionKey: string;
  type?: TransitionType;
  className?: string;
};

function AnimatedRegion({
  children,
  transitionKey,
  type = 'crossFade',
  className,
}: AnimatedRegionProps) {
  return (
    <AutoResizer
      animateWidth
      initial={false}
      overflow="visible"
      className="flex items-center justify-center"
    >
      <AutoTransition
        transitionKey={transitionKey}
        initial={false}
        type={type}
        className={className}
      >
        {children}
      </AutoTransition>
    </AutoResizer>
  );
}

export default function TimerDisplay() {
  const { getActiveTimer, updateTimer, checkAndUpdateDefaultTimer } = useTimers();
  const { isFullscreen, timerFontSize: rawTimerFontSize, labelFontSize: rawLabelFontSize } = useFullscreen();
  const { t, currentLang } = useTranslation();
  const timerFontSize = (rawTimerFontSize || 'medium') as FontSize;
  const labelFontSize = (rawLabelFontSize || 'medium') as FontSize;
  const [timeValue, setTimeValue] = useState<DisplayTime>({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isInitialValuesReady, setIsInitialValuesReady] = useState(false);
  const [isDisplayVisible, setIsDisplayVisible] = useState(false);
  const [showDays, setShowDays] = useState(true);
  const [showYears, setShowYears] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLapModalOpen, setIsLapModalOpen] = useState(false);
  
  // 使用 ref 跟踪最后计算的时间，避免不必要的重渲染
  const lastTimeRef = useRef<DisplayTime | null>(null);
  const activeTimerIdentityRef = useRef<{ id: string; type: TimerType } | null>(null);
  const initialValuesReadyRef = useRef(false);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 判断两个时间对象是否相等
  const areTimesEqual = (time1: DisplayTime, time2: DisplayTime | null) => {
    return time2 !== null &&
           time1.years === time2.years &&
           time1.days === time2.days && 
           time1.hours === time2.hours && 
           time1.minutes === time2.minutes && 
           time1.seconds === time2.seconds;
  };

  // 统一的计时计算函数
  const calculateTime = (timer: Timer, now: number, timerChanged: boolean) => {
    // 当页面在后台时，可能会暂停
    if (document.visibilityState !== 'visible') {
      return;
    }
    
    switch (getTimerType(timer)) {
      case 'stopwatch':
        calculateStopwatchTime(timer as StopwatchTimer, now);
        break;
      case 'worldclock':
        calculateWorldClockTime(timer as WorldClockTimer, now);
        break;
      default:
        calculateCountdownTime(timer as CountdownTimer, now, timerChanged);
        break;
    }
  };
  
  // 判断是否只有秒数变化（避免分钟数字不必要的重新渲染）
  const isOnlySecondsChanged = (time1: DisplayTime, time2: DisplayTime) => {
    return time1.years === time2.years &&
           time1.days === time2.days && 
           time1.hours === time2.hours && 
           time1.minutes === time2.minutes && 
           time1.seconds !== time2.seconds;
  };
  
  // 计算倒计时剩余时间
  const calculateCountdownTime = (timer: CountdownTimer, now: number, timerChanged: boolean) => {
    const targetDate = toDate(timer.targetDate);
    const difference = targetDate.getTime() - now;
    
    if (difference <= 0) {
      // 倒计时结束
      if (!isFinished) {
        setIsFinished(true);
        setTimeValue({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        lastTimeRef.current = { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

        try {
          const createdAt = timer.createdAt ? new Date(timer.createdAt).getTime() : null;
          const totalMs = createdAt ? targetDate.getTime() - createdAt : null;
          track('countdown_finished', {
            duration_bucket: totalMs !== null ? bucketDurationMs(totalMs) : 'unknown',
          });
        } catch (e) {}
        
        // 检查并更新过期的默认计时器
        if (checkAndUpdateDefaultTimer) {
          checkAndUpdateDefaultTimer();
        }
        
        // 当倒计时结束时发送通知
        try {
          console.log('倒计时结束，尝试发送通知:', timer.name);
          addNotification({
            id: timer.id,
            title: timer.name,
            targetTime: Date.now()
          }).catch(error => {
            console.error('发送倒计时结束通知失败:', error);
          });
        } catch (error) {
          console.error('发送倒计时结束通知失败:', error);
        }
      }

      if (timerChanged) {
        setTimeValue({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        lastTimeRef.current = { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
        setShowYears(false);
        setShowDays(false);
      }
      return;
    }
    
    // 倒计时未结束
    if (isFinished) {
      setIsFinished(false);
    }
    
    // 计算天、时、分、秒
    const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const days = totalDays % 365;
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    
    const newTimeLeft = { years, days, hours, minutes, seconds };
    
    // 只有当时间真正变化时才更新状态
    if (!areTimesEqual(newTimeLeft, lastTimeRef.current)) {
      setTimeValue(newTimeLeft);
      lastTimeRef.current = newTimeLeft;
      setShowYears(years > 0);
      setShowDays(days > 0 || years > 0); // 当有年份或天数大于0时显示天数
    }
  };
  
  // 计算正计时经过时间
  const calculateStopwatchTime = (timer: StopwatchTimer, now: number) => {
    const startTime = toDate(timer.startTime);
    let elapsedMs = 0;
    
    if (timer.isRunning) {
      // 正在运行中
      elapsedMs = now - startTime.getTime() - (timer.totalPausedTime || 0);
    } else if (timer.pausedAt) {
      // 已暂停，显示暂停时的时间
      const pausedAt = toDate(timer.pausedAt);
      elapsedMs = pausedAt.getTime() - startTime.getTime() - (timer.totalPausedTime || 0);
    } else {
      // 初始状态或已重置
      elapsedMs = 0;
    }
    
    elapsedMs = Math.max(0, elapsedMs); // 确保不为负数
    
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const totalDays = Math.floor(totalSeconds / (24 * 60 * 60));
    const years = Math.floor(totalDays / 365);
    const days = totalDays % 365;
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    
    const newTimeValue = { years, days, hours, minutes, seconds };
    
    // 智能更新：只有当时间确实变化时才更新状态
    // 对于正计时，我们特别处理避免不必要的重新渲染
    if (!areTimesEqual(newTimeValue, lastTimeRef.current)) {
      // 如果只是秒数变化，我们延迟更新其他数字避免闪烁
      if (timer.type === 'stopwatch' && lastTimeRef.current && isOnlySecondsChanged(newTimeValue, lastTimeRef.current)) {
        // 只更新秒数
        setTimeValue(prev => ({ ...prev, seconds }));
      } else {
        // 全部更新
        setTimeValue(newTimeValue);
      }
      lastTimeRef.current = newTimeValue;
      setShowYears(years > 0);
      setShowDays(days > 0 || years > 0); // 当有年份或天数大于0时显示天数
    }
  };
  
  // 计算世界时钟时间
  const calculateWorldClockTime = (timer: WorldClockTimer, now: number) => {
    const timeInTimezone = new Date(new Date(now).toLocaleString("en-US", {timeZone: timer.timezone}));
    
    const hours = timeInTimezone.getHours();
    const minutes = timeInTimezone.getMinutes();
    const seconds = timeInTimezone.getSeconds();
    
    const newTimeValue = { 
      years: 0,
      days: 0, 
      hours: hours, 
      minutes: minutes, 
      seconds: seconds 
    };
    
    if (!areTimesEqual(newTimeValue, lastTimeRef.current)) {
      setTimeValue(newTimeValue);
      lastTimeRef.current = newTimeValue;
      setShowYears(false); // 世界时钟不显示年数
      setShowDays(false); // 世界时钟不显示天数
    }
  };
  
  // 主计时逻辑
  useEffect(() => {
    const clearScheduledUpdate = () => {
      if (timerIdRef.current !== null) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
    };

    const updateActiveTimer = () => {
      clearScheduledUpdate();
      if (document.visibilityState !== 'visible') return;

      const timer = getActiveTimer() as Timer | null;
      if (!timer) return;

      const timerType = getTimerType(timer);
      const previousIdentity = activeTimerIdentityRef.current;
      const timerChanged = !previousIdentity || previousIdentity.id !== timer.id || previousIdentity.type !== timerType;
      if (timerChanged) {
        activeTimerIdentityRef.current = { id: timer.id, type: timerType };
        // Keep timeValue for NumberFlow's old-to-new animation, but make the
        // next calculation refresh all timer-specific display fields.
        lastTimeRef.current = null;
        setIsLapModalOpen(false);
        setIsRunning(timerType === 'stopwatch' && (timer as StopwatchTimer).isRunning === true);
        if (timerType !== 'countdown') setIsFinished(false);
      }

      // Use one timestamp for both the displayed value and its next boundary.
      const now = Date.now();
      calculateTime(timer, now, timerChanged);
      if (!initialValuesReadyRef.current) {
        initialValuesReadyRef.current = true;
        setIsInitialValuesReady(true);
      }
      timerIdRef.current = setTimeout(updateActiveTimer, getNextTimerUpdateDelay(timer, now));
    };

    updateActiveTimer();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActiveTimer();
      } else {
        clearScheduledUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearScheduledUpdate();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getActiveTimer, isFinished, checkAndUpdateDefaultTimer, isRunning]);
  
  // 正计时控制函数
  const handleStopwatchControl = (action: StopwatchAction) => {
    const timer = getActiveTimer() as StopwatchTimer | null;
    if (!timer || timer.type !== 'stopwatch') return;
    
    const now = new Date();
    
    switch (action) {
      case 'play':
        if (timer.pausedAt) {
          // 从暂停状态恢复，计算已暂停的总时间
          const pausedDuration = now.getTime() - toDate(timer.pausedAt).getTime();
          const newTotalPausedTime = (timer.totalPausedTime || 0) + pausedDuration;
          updateTimer(timer.id, {
            isRunning: true,
            pausedAt: null,
            totalPausedTime: newTotalPausedTime
          });
        } else {
          // 第一次开始
          updateTimer(timer.id, {
            isRunning: true,
            startTime: timer.startTime || now.toISOString(),
            pausedAt: null,
            totalPausedTime: timer.totalPausedTime || 0
          });
        }
        setIsRunning(true);
        track('stopwatch_play');
        break;

      case 'pause':
        updateTimer(timer.id, {
          isRunning: false,
          pausedAt: now.toISOString()
        });
        setIsRunning(false);
        track('stopwatch_pause');
        break;

      case 'stop':
        updateTimer(timer.id, {
          isRunning: false,
          startTime: now.toISOString(),
          pausedAt: null,
          totalPausedTime: 0,
          laps: [] // 清空分段记录
        });
        setIsRunning(false);
        setTimeValue({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        lastTimeRef.current = { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
        track('stopwatch_stop');
        break;

      case 'lap':
        // Record lap time
        const startTime = toDate(timer.startTime);
        const elapsedMs = now.getTime() - startTime.getTime() - (timer.totalPausedTime || 0);
        const laps = timer.laps || [];
        // Use a combination of timestamp and random to avoid collision
        const newLap = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now.toISOString(),
          elapsedMs: elapsedMs
        };
        updateTimer(timer.id, {
          laps: [...laps, newLap]
        });
        track('stopwatch_lap', { lap_count: laps.length + 1 });
        break;
    }
  };
  
  const activeTimer = getActiveTimer() as Timer | null;
  const activeTimerType = activeTimer ? getTimerType(activeTimer) : null;
  const numberTrend: -1 | 1 = activeTimerType === 'countdown' ? -1 : 1;
  const activeStopwatchTimer = activeTimer?.type === 'stopwatch'
    ? activeTimer as StopwatchTimer
    : null;

  useEffect(() => {
    if (!isInitialValuesReady || isDisplayVisible || !activeTimer) return undefined;

    // Let the timer-specific rows and AutoResizer measurements settle first.
    const revealTimer = window.setTimeout(() => setIsDisplayVisible(true), 400);
    return () => window.clearTimeout(revealTimer);
  }, [
    isInitialValuesReady,
    isDisplayVisible,
    activeTimer?.id,
    activeTimerType,
    showYears,
    showDays,
    isFinished,
    isRunning,
  ]);

  // 字体大小映射
  const getTimerFontSizeClasses = (): Record<FontSize, string> => {
    if (isFullscreen) {
      // 全屏模式：使用固定大尺寸
      return {
        small: 'text-5xl sm:text-6xl md:text-7xl',
        medium: 'text-6xl sm:text-7xl md:text-8xl',
        large: 'text-7xl sm:text-8xl md:text-9xl'
      };
    } else {
      // 普通模式：使用响应式尺寸
      return {
        small: 'text-4xl sm:text-5xl md:text-6xl',
        medium: 'text-5xl sm:text-6xl md:text-7xl',
        large: 'text-6xl sm:text-7xl md:text-8xl'
      };
    }
  };

  const getLabelFontSizeClasses = (): Record<FontSize, string> => {
    return {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };
  };

  const timerClasses = getTimerFontSizeClasses();
  const labelClasses = getLabelFontSizeClasses();

  if (!activeTimer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-400">{t('timer.noActiveTimer')}</p>
      </div>
    );
  }
  
  // 获取显示标题和描述
  const getTimerTitle = () => {
    switch (activeTimer.type) {
      case 'stopwatch':
        return activeTimer.name;
      case 'worldclock':
        return activeTimer.name; // 直接使用用户设置的名称
      default:
        return activeTimer.name;
    }
  };
  
  const getTimerDescription = () => {
    switch (activeTimer.type) {
      case 'stopwatch':
        return isRunning ? t('timer.running') : t('timer.paused');
      case 'worldclock':
        return `${activeTimer.country} - ${activeTimer.timezone}`;
      default:
        return `${t('timer.target')}: ${toDate((activeTimer as CountdownTimer).targetDate).toLocaleString()}`;
    }
  };
  
  return (
    <motion.div 
      className="flex flex-col items-center justify-center text-center px-4 relative z-10"
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={isDisplayVisible
        ? { opacity: 1, scale: 1, y: 0 }
        : { opacity: 0, scale: 0.96, y: 24 }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
      aria-hidden={!isDisplayVisible}
      inert={!isDisplayVisible}
    >
      <div className="relative flex flex-col items-center">
      {/* 计时器名称 */}
      <AnimatedRegion
        transitionKey="timer-title"
        className="pb-4"
      >
        <motion.h2
          className={`${isFullscreen ? 'text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} font-medium`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            color: activeTimer.color,
            transition: 'color 0.5s var(--transition-timing)'
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`title:${activeTimer.id}:${activeTimer.type}:${getTimerTitle()}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {getTimerTitle()}
            </motion.span>
          </AnimatePresence>
        </motion.h2>
      </AnimatedRegion>
      
      {/* 时间显示 */}
      <LayoutGroup id="timer-display-numeric-layout">
      <AutoResizer
        animateWidth={isInitialValuesReady}
        initial={false}
        overflow="visible"
        className="flex items-center justify-center"
      >
      <motion.div 
        className={`flex items-center justify-center ${showYears ? 'flex-col sm:flex-row gap-2 sm:gap-0' : 'flex-row'} space-x-0 sm:space-x-4`}
        layout="position"
        transition={{
          duration: 0.32,
          ease: 'easeOut',
          layout: { type: 'tween', duration: 0.24, ease: 'easeOut' },
        }}
      >
        {/* 第一行：年数和天数 - 仅在需要时显示 */}
        <AutoTransition
          transitionKey={showYears ? 'years-visible' : 'years-hidden'}
          initial={false}
          type="fade"
          className="flex items-center justify-center space-x-2 sm:space-x-4"
        >
          {showYears ? (
            <Fragment key="years-row">
            <DigitColumn
              key="years"
              value={timeValue.years}
              isValueVisible={isDisplayVisible}
              trend={numberTrend}
              label={t('time.years')}
              color={activeTimer.color || '#0ea5e9'}
              fontSize={timerFontSize}
              labelFontSize={labelFontSize}
            />
            <motion.span
              key="years-separator"
              layout="position"
              transition={{ layout: { type: 'tween', duration: 0.24, ease: 'easeOut' } }}
              className={`${timerClasses[timerFontSize]} font-thin text-gray-400`}
            >:</motion.span>
            <AutoTransition
              transitionKey={showDays ? 'days-visible-with-years' : 'days-hidden-with-years'}
              initial={false}
              type="fade"
              className="flex items-center justify-center space-x-2 sm:space-x-4"
            >
              {showDays ? (
                <Fragment key="days">
                <DigitColumn
                  key="days"
                  value={timeValue.days}
                  isValueVisible={isDisplayVisible}
                  trend={numberTrend}
                  label={t('time.days')}
                  color={activeTimer.color || '#0ea5e9'}
                  fontSize={timerFontSize}
                  labelFontSize={labelFontSize}
                />
                <motion.span
                  key="days-separator"
                  layout="position"
                  transition={{ layout: { type: 'tween', duration: 0.24, ease: 'easeOut' } }}
                  className="text-4xl sm:text-5xl md:text-6xl font-thin text-gray-400 hidden sm:inline"
                >:</motion.span>
                </Fragment>
              ) : null}
            </AutoTransition>
            </Fragment>
          ) : null}
        </AutoTransition>

        {/* 第二行：天数（当没有年数时）、小时、分钟、秒 */}
        <motion.div
          key="clock-row"
          layout="position"
          transition={{ layout: { type: 'tween', duration: 0.24, ease: 'easeOut' } }}
          className="flex items-center justify-center space-x-2 sm:space-x-4"
        >
          {/* 天数 - 仅在没有年数且需要时显示 */}
          <AutoTransition
            transitionKey={!showYears && showDays ? 'days-visible-without-years' : 'days-hidden-without-years'}
            initial={false}
            type="fade"
            className="flex items-center justify-center space-x-2 sm:space-x-4"
          >
            {!showYears && showDays ? (
              <Fragment key="days">
              <DigitColumn
                key="days"
                value={timeValue.days}
                isValueVisible={isDisplayVisible}
                trend={numberTrend}
                label={t('time.days')}
                color={activeTimer.color || '#0ea5e9'}
                fontSize={timerFontSize}
                labelFontSize={labelFontSize}
              />
              <motion.span
                key="days-separator"
                layout="position"
                transition={{ layout: { type: 'tween', duration: 0.24, ease: 'easeOut' } }}
                className={`${timerClasses[timerFontSize]} font-thin text-gray-400`}
              >:</motion.span>
              </Fragment>
            ) : null}
          </AutoTransition>

          {/* 小时 */}
          <DigitColumn
            key="hours"
            value={timeValue.hours}
            isValueVisible={isDisplayVisible}
            trend={numberTrend}
            label={t('time.hours')}
            color={activeTimer.color || '#0ea5e9'}
            fontSize={timerFontSize}
            labelFontSize={labelFontSize}
          />
          <motion.span
            key="hours-separator"
            layout="position"
            transition={{ layout: { type: 'tween', duration: 0.24, ease: 'easeOut' } }}
            className="text-4xl sm:text-5xl md:text-6xl font-thin text-gray-400"
          >:</motion.span>
          
          {/* 分钟 */}
          <DigitColumn
            key="minutes"
            value={timeValue.minutes}
            isValueVisible={isDisplayVisible}
            trend={numberTrend}
            cycleAtSixty
            label={t('time.minutes')}
            color={activeTimer.color || '#0ea5e9'}
            fontSize={timerFontSize}
            labelFontSize={labelFontSize}
          />
          <motion.span
            key="minutes-separator"
            layout="position"
            transition={{ layout: { type: 'tween', duration: 0.24, ease: 'easeOut' } }}
            className="text-4xl sm:text-5xl md:text-6xl font-thin text-gray-400"
          >:</motion.span>
          
          {/* 秒 */}
          <DigitColumn
            key="seconds"
            value={timeValue.seconds}
            isValueVisible={isDisplayVisible}
            trend={numberTrend}
            cycleAtSixty
            label={t('time.seconds')}
            color={activeTimer.color || '#0ea5e9'}
            fontSize={timerFontSize}
            labelFontSize={labelFontSize}
          />
        </motion.div>
      </motion.div>
      </AutoResizer>
      </LayoutGroup>
      
      <div className="relative z-20 flex flex-col items-center whitespace-nowrap">
        {/* The lower controls stay in the measured flow so the complete content group remains centered. */}
        <AnimatedRegion
          transitionKey={`controls:${activeTimer.id}:${activeTimer.type === 'stopwatch' ? 'stopwatch' : 'none'}`}
          type="slideUp"
          className="pt-8"
        >
          {activeTimer.type === 'stopwatch' ? (
            <motion.div
              className="flex space-x-4 relative"
              style={{ zIndex: 40, pointerEvents: 'auto' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AutoTransition
                transitionKey={isRunning ? 'stopwatch-pause-control' : 'stopwatch-play-control'}
                initial={false}
                type="crossFade"
                className="flex items-center justify-center"
              >
                <button
                  onClick={() => handleStopwatchControl(isRunning ? 'pause' : 'play')}
                  className="glass-card p-4 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer select-none"
                  style={{ color: activeTimer.color, zIndex: 41, position: 'relative', pointerEvents: 'auto', userSelect: 'none' }}
                >
                  {isRunning ? <FiPause className="text-xl pointer-events-none" /> : <FiPlay className="text-xl pointer-events-none" />}
                </button>
              </AutoTransition>
              <button
                onClick={() => handleStopwatchControl('lap')}
                disabled={!isRunning}
                className="glass-card p-4 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: activeTimer.color, zIndex: 41, position: 'relative', pointerEvents: 'auto', userSelect: 'none' }}
              >
                <FiFlag className="text-xl pointer-events-none" />
              </button>
              <button
                onClick={() => handleStopwatchControl('stop')}
                className="glass-card p-4 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer select-none"
                style={{ color: activeTimer.color, zIndex: 41, position: 'relative', pointerEvents: 'auto', userSelect: 'none' }}
              >
                <FiSquare className="text-xl pointer-events-none" />
              </button>
            </motion.div>
          ) : null}
        </AnimatedRegion>

        <AnimatedRegion
          transitionKey={`finished:${activeTimer.id}:${isFinished && activeTimer.type === 'countdown' ? 'yes' : 'no'}`}
          type="scale"
          className="pt-8"
        >
          {isFinished && activeTimer.type === 'countdown' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="glass-card px-6 py-4 rounded-xl"
            >
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{t('timer.finished')}</p>
            </motion.div>
          ) : null}
        </AnimatedRegion>

        <AnimatedRegion
          transitionKey={`description:${activeTimer.id}:${activeTimer.type}:${getTimerDescription()}`}
          className="pt-6"
        >
          <motion.p
            className="text-sm text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {getTimerDescription()}
          </motion.p>
        </AnimatedRegion>

        <AnimatedRegion
          transitionKey={`laps:${activeTimer.id}:${activeStopwatchTimer?.laps?.length ?? 0}`}
          type="slideUp"
          className="pt-6"
        >
          {activeStopwatchTimer && activeStopwatchTimer.laps && activeStopwatchTimer.laps.length > 0 ? (
            <motion.button
              className="glass-card px-6 py-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer"
              style={{ color: activeTimer.color, zIndex: 10, position: 'relative', pointerEvents: 'auto' }}
              onClick={() => { setIsLapModalOpen(true); track('lap_modal_open'); }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center space-x-2">
                <FiList className="text-xl" />
                <span className="font-medium">{t('lap.title')}</span>
                <span className="text-sm opacity-70">({activeStopwatchTimer.laps.length})</span>
              </div>
            </motion.button>
          ) : null}
        </AnimatedRegion>
      </div>
      </div>
      
      {/* 分段计时弹窗 */}
      <AutoTransition portal transitionKey={isLapModalOpen && activeStopwatchTimer ? 'lap-modal-open' : 'lap-modal-closed'} initial={false} type="fade">
        {isLapModalOpen && activeStopwatchTimer ? (
          <LapTimesModal 
            onClose={() => setIsLapModalOpen(false)}
            laps={activeStopwatchTimer.laps || []}
            timerColor={activeTimer.color}
          />
        ) : null}
      </AutoTransition>
    </motion.div>
  );
}
