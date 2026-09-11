import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';

export default function ScrollProgress() {
  const { accentColor } = useTheme();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const [isVisible, setIsVisible] = useState(false);
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
  
  // 只有在滚动一定距离后才显示进度条，使用节流函数优化Safari中的滚动事件
  useEffect(() => {
    let ticking = false;
    let lastScrollPosition = 0;
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // 在Safari上使用较大的滚动阈值，减少状态更新
      const threshold = isSafari ? 80 : 50;
      
      // 只有滚动变化超过一定值时才更新状态，避免Safari中的频繁重渲染
      if (Math.abs(scrollPosition - lastScrollPosition) > (isSafari ? 20 : 5)) {
        setIsVisible(scrollPosition > threshold);
        lastScrollPosition = scrollPosition;
      }
      
      ticking = false;
    };
    
    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', requestTick, { passive: true });
    return () => window.removeEventListener('scroll', requestTick);
  }, [isSafari]);
  
  return (
    <>
      {/* 顶部进度条 */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 z-[900] origin-left"
        style={{ 
          scaleX,
          backgroundColor: accentColor,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          // 添加硬件加速
          transform: "translateZ(0) scaleX(var(--scale-x))",
          WebkitTransform: "translateZ(0) scaleX(var(--scale-x))",
          willChange: "transform"
        }}
        // 为Safari添加属性以避免动画抖动
        animate={isSafari ? { "--scale-x": scrollYProgress.get() } : undefined}
      />
    </>
  );
}
