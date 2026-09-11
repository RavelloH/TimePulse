import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';

export default function ScrollHandle() {
  const { accentColor } = useTheme();
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  
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
  
  // 解析颜色并创建RGBA
  const hexToRgba = (hex: string, alpha = 1) => {
    if (!hex) return `rgba(14, 165, 233, ${alpha})`;
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  // 监听滚动事件，使用节流技术优化Safari性能
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    let ticking = false;
    
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimer);
      
      // Safari上增加滚动状态的持续时间，减少状态切换
      const duration = isSafari ? 1500 : 1000;
      
      scrollTimer = setTimeout(() => {
        setIsScrolling(false);
      }, duration);
      
      ticking = false;
    };
    
    const requestTick = () => {
      if (!ticking) {
        // 使用requestAnimationFrame优化滚动事件
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };
    
    // 对Safari使用更少的滚动事件监听
    if (isSafari) {
      // Safari上降低事件监听频率
      let lastScrollPosition = window.scrollY;
      
      const throttledScroll = () => {
        const currentScrollPosition = window.scrollY;
        // 只有滚动位置变化足够大时才处理
        if (Math.abs(currentScrollPosition - lastScrollPosition) > 30) {
          lastScrollPosition = currentScrollPosition;
          handleScroll();
        }
      };
      
      window.addEventListener('scroll', throttledScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', throttledScroll);
        clearTimeout(scrollTimer);
      };
    } else {
      // 其他浏览器使用标准处理
      window.addEventListener('scroll', requestTick, { passive: true });
      return () => {
        window.removeEventListener('scroll', requestTick);
        clearTimeout(scrollTimer);
      };
    }
  }, [isSafari]);
  
  // Safari上可以选择禁用该组件或使用简化版本
  if (isSafari) {
    return (
      <motion.div
        className="fixed right-2 top-1/2 -translate-y-1/2 z-[910] h-[30vh] w-1 rounded-full"
        style={{
          backgroundColor: isScrolling ? 
            hexToRgba(accentColor, 0.2) : 
            'transparent',
          // 使用更简单的过渡以避免Safari上的性能问题
          transition: 'background-color 0.5s ease',
          // 添加硬件加速
          transform: "translateY(-50%) translateZ(0)",
          WebkitTransform: "translateY(-50%) translateZ(0)",
          willChange: "transform"
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isScrolling ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />
    );
  }
  
  return (
    <motion.div
      className="fixed right-2 top-1/2 -translate-y-1/2 z-[910] h-[30vh] w-1 rounded-full"
      style={{
        backgroundColor: isScrolling || isHovering ? 
          hexToRgba(accentColor, 0.2) : 
          'transparent',
        transition: 'background-color 0.3s ease'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      initial={{ opacity: 0 }}
      animate={{ opacity: isScrolling || isHovering ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    />
  );
}
