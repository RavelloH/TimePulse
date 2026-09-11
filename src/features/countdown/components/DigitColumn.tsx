import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type FontSize = 'small' | 'medium' | 'large';

type DigitColumnProps = {
  value: string;
  label: string;
  color?: string;
  fontSize?: FontSize;
  labelFontSize?: FontSize;
};

type AnimationState = {
  timer: ReturnType<typeof setTimeout> | null;
  isAnimating: boolean;
  lastValue: string;
};

export default function DigitColumn({
  value,
  label,
  color = '#0ea5e9',
  fontSize = 'medium',
  labelFontSize = 'medium',
}: DigitColumnProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [isChanging, setIsChanging] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  
  // 使用 useRef 跟踪动画状态，避免竞争条件
  const animationRef = useRef<AnimationState>({
    timer: null,
    isAnimating: false,
    lastValue: value
  });
  
  // 检测Safari浏览器
  useEffect(() => {
    // 检测Safari浏览器
    const isSafariBrowser = 
      navigator.userAgent.indexOf('Safari') !== -1 && 
      navigator.userAgent.indexOf('Chrome') === -1;
    
    // 检测iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    
    setIsSafari(isSafariBrowser || isIOS);
  }, []);
  
  // 重置动画状态的函数
  const resetAnimationState = () => {
    // 清除任何正在进行的动画计时器
    if (animationRef.current.timer) {
      clearTimeout(animationRef.current.timer);
      animationRef.current.timer = null;
    }
    
    // 立即同步状态到最新值
    setPrevValue(value);
    setIsChanging(false);
    animationRef.current.isAnimating = false;
    animationRef.current.lastValue = value;
  };
  
  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 当页面重新变为可见时，重置动画状态
        resetAnimationState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [value]);
  
  // 监听数字变化
  useEffect(() => {
    // 避免不必要的动画 - 如果值相同，不触发动画
    if (value === animationRef.current.lastValue) {
      return;
    }
    
    // 更新 ref 中的最新值
    animationRef.current.lastValue = value;
    
    // 如果已经有动画在进行，先清除它
    if (animationRef.current.timer) {
      clearTimeout(animationRef.current.timer);
    }
    
    // 只有当前没有动画在进行时才开始新动画
    if (!animationRef.current.isAnimating) {
      setPrevValue(prevValue); // 确保使用当前的 prevValue
      setIsChanging(true);
      animationRef.current.isAnimating = true;
    } else {
      // 如果动画正在进行，立即重置到新状态
      resetAnimationState();
      
      // 延迟一帧再开始新动画
      requestAnimationFrame(() => {
        setPrevValue(value);
        setIsChanging(true);
        animationRef.current.isAnimating = true;
      });
    }
    
    // 设置动画结束时间
    const animationDuration = isSafari ? 200 : 300;
    animationRef.current.timer = setTimeout(() => {
      setPrevValue(value);
      setIsChanging(false);
      animationRef.current.isAnimating = false;
      animationRef.current.timer = null;
    }, animationDuration);
    
    // 清理函数
    return () => {
      if (animationRef.current.timer) {
        clearTimeout(animationRef.current.timer);
      }
    };
  }, [value, prevValue, isSafari]);
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (animationRef.current.timer) {
        clearTimeout(animationRef.current.timer);
      }
    };
  }, []);
  
  // 根据数字位数确定宽度类名
  const getWidthClass = () => {
    const digits = value.toString().length;
    if (digits >= 3) {
      return "w-24 sm:w-32 md:w-40"; // 三位数或更多时加宽
    } else if (digits === 2) {
      return "w-20 sm:w-24 md:w-32"; // 两位数
    } else {
      return "w-16 sm:w-20 md:w-24"; // 一位数
    }
  };

  // 字体大小映射
  const getFontSizeClasses = (): Record<FontSize, string> => {
    return {
      small: 'text-4xl sm:text-5xl md:text-6xl',
      medium: 'text-5xl sm:text-6xl md:text-7xl',
      large: 'text-6xl sm:text-7xl md:text-8xl'
    };
  };

  const getLabelFontSizeClasses = (): Record<FontSize, string> => {
    return {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };
  };

  const numberSizeClass = getFontSizeClasses()[fontSize] || getFontSizeClasses().medium;
  const labelSizeClass = getLabelFontSizeClasses()[labelFontSize] || getLabelFontSizeClasses().medium;
  
  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className={`${getWidthClass()} h-24 sm:h-32 md:h-36 rounded-xl glass-card flex items-center justify-center relative overflow-hidden`}
        style={{ 
          boxShadow: `0 0 30px ${color}20`,
          transition: 'box-shadow 0.5s var(--transition-timing)',
          // 添加硬件加速
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
          willChange: "transform"
        }}
        whileHover={{ 
          boxShadow: `0 0 40px ${color}40`,
          scale: 1.02 
        }}
        transition={{ duration: 0.3 }}
      >
        {/* 数字动画 */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* 每个动画状态使用唯一ID，避免React混淆元素 */}
          <AnimatePresence mode="wait">
            {isChanging ? (
              <>
                {/* 旧数字向上滑出 */}
                <motion.span
                  key={`prev-${prevValue}-${Date.now()}`}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: '-100%', opacity: 0 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: isSafari ? 0.2 : 0.3, ease: 'easeInOut' }}
                  className={`absolute ${numberSizeClass} font-bold`}
                  style={{ 
                    color,
                    // 添加硬件加速
                    transform: "translateZ(0)",
                    WebkitTransform: "translateZ(0)",
                    willChange: "transform"
                  }}
                >
                  {prevValue}
                </motion.span>

                {/* 新数字从下向上滑入 */}
                <motion.span
                  key={`current-${value}-${Date.now()}`}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: isSafari ? 0.2 : 0.3, ease: 'easeInOut' }}
                  className={`absolute ${numberSizeClass} font-bold`}
                  style={{ 
                    color,
                    // 添加硬件加速
                    transform: "translateZ(0)",
                    WebkitTransform: "translateZ(0)",
                    willChange: "transform"
                  }}
                >
                  {value}
                </motion.span>
              </>
            ) : (
              <motion.span
                key={`static-${value}-${animationRef.current.isAnimating ? Date.now() : 'stable'}`}
                className={`${numberSizeClass} font-bold`}
                style={{ 
                  color,
                  // 添加硬件加速
                  transform: "translateZ(0)",
                  WebkitTransform: "translateZ(0)"
                }}
              >
                {value}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* 标签 */}
      <motion.span
        className={`mt-2 ${labelSizeClass} text-gray-500 dark:text-gray-400`}
        whileHover={{ color }}
        transition={{ duration: 0.3 }}
      >
        {label}
      </motion.span>
    </div>
  );
}
