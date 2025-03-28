import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import { ThemeColorSynchronizer } from '../../context/ThemeContext';

export default function Layout({ children }) {
  const { scrollYProgress } = useScroll();
  const footerRef = useRef(null);
  const [showFooter, setShowFooter] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  
  // 页面滚动时，Footer的透明度
  const footerOpacity = useTransform(
    scrollYProgress, 
    [0, 0.8, 0.9, 1], 
    [0, 0, 0.8, 1]
  );
  
  const footerBlur = useTransform(
    scrollYProgress, 
    [0.8, 1], 
    [0, 16]
  );
  
  // 监听滚动到底部事件
  useEffect(() => {
    const handleScroll = () => {
      // 设置已经滚动标志
      if (window.scrollY > 10 && !hasScrolled) {
        setHasScrolled(true);
      }
      
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 只有当滚动接近底部时才显示footer
      const isNearBottom = scrollPosition + windowHeight >= documentHeight - 100;
      
      if (isNearBottom && !showFooter) {
        setShowFooter(true);
        if (window.location.hash !== '#footer') {
          window.location.hash = 'footer';
        }
      } else if (!isNearBottom && showFooter) {
        setShowFooter(false);
        if (window.location.hash === '#footer') {
          window.location.hash = '';
        }
      }
    };
    
    // 初始状态下不显示footer
    setShowFooter(false);
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showFooter, hasScrolled]);

  return (
    <ThemeColorSynchronizer>
      <div className="flex flex-col min-h-screen">
        <Header />
        
        {children}
        
        {/* 修改 Footer 容器，适应不同屏幕大小 */}
        <motion.div 
          ref={footerRef}
          style={{ 
            opacity: footerOpacity,
            backdropFilter: `blur(${footerBlur.get()}px)`,
            pointerEvents: showFooter ? 'auto' : 'none'
          }} 
          className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto"
        >
          <div className="w-full">
            <Footer />
          </div>
        </motion.div>
        
        {/* 下滑提示 - 当footer显示时或已经滚动时隐藏 */}
        {!showFooter && !hasScrolled && (
          <motion.div 
            className="fixed bottom-24 left-0 right-0 mx-auto w-full text-center text-gray-400 text-sm pointer-events-none z-20"
            initial={{ opacity: 0.6 }}
            animate={{ 
              opacity: [0.6, 1, 0.6],
              y: [0, 10, 0]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 2
            }}
          >
            <p>向下滑动查看更多信息</p>
            <svg className="w-6 h-6 mx-auto mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        )}
        
        {/* 添加滚动空间 */}
        <div className="h-screen"></div>
      </div>
    </ThemeColorSynchronizer>
  );
}
