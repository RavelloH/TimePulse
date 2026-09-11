import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTimers } from '@/app/providers/TimerProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useBackground } from '@/app/providers/BackgroundProvider';
import { AutoTransition } from '@/components/ui';

type Circle = {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  blur: number;
  opacity: number;
};

const getColors = (baseColor: string, _isDark: boolean): string[] => {
  let r: number;
  let g: number;
  let b: number;

  if (baseColor.startsWith('#')) {
    const hex = baseColor.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    r = 14;
    g = 165;
    b = 233;
  }

  return [
    `rgba(${r}, ${g}, ${b}, 0.5)`,
    `rgba(${r * 0.8}, ${g * 1.1}, ${b * 1.2}, 0.5)`,
    `rgba(${r * 1.2}, ${g * 0.8}, ${b * 0.9}, 0.5)`,
    `rgba(${r * 0.9}, ${g * 0.9}, ${b * 1.3}, 0.5)`,
    `rgba(${r * 1.1}, ${g * 1.2}, ${b * 0.8}, 0.5)`,
    `rgba(${r * 1.3}, ${g * 0.9}, ${b * 0.9}, 0.5)`,
  ];
};

export default function GradientBackground() {
  const { getActiveTimer, activeTimerId } = useTimers();
  const { theme } = useTheme();
  const { backgroundType } = useBackground();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [prevTimerId, setPrevTimerId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSafari, setIsSafari] = useState(false);
  const activeTimer = getActiveTimer();

  // 检测Safari浏览器
  useEffect(() => {
    const isSafariBrowser =
      navigator.userAgent.indexOf('Safari') !== -1 &&
      navigator.userAgent.indexOf('Chrome') === -1;

    // 检测iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

    setIsSafari(isSafariBrowser || isIOS);
  }, []);

  // 生成渐变圆圈 - 针对Safari减少圆圈数量和动画复杂度
  useEffect(() => {
    const isNewTimer = activeTimerId !== prevTimerId;
    if (isNewTimer) {
      setPrevTimerId(activeTimerId);
    }

    const baseColor = activeTimer?.color || '#0ea5e9';
    const colors = getColors(baseColor, theme === 'dark');

    // 针对Safari减少圆圈数量
    const circleCount = 5;

    // 生成或更新圆圈配置
    if (circles.length === 0 || isNewTimer) {
      const newCircles = Array.from({ length: circleCount }, (_, i): Circle => ({
        id: i,
        x: Math.random() * 100 - 30 + Math.random() * 40,
        y: Math.random() * 100 - 30 + Math.random() * 40,
        size: 30 + Math.random() * 40,
        speedX: (Math.random() - 0.5) * (isSafari ? 0.01 : 0.03),
        speedY: (Math.random() - 0.5) * (isSafari ? 0.01 : 0.03),
        color: colors[i % colors.length],
        blur: isSafari ? 40 : 60 + Math.random() * 40,
        opacity: 0.3 + Math.random() * (isSafari ? 0.2 : 0.3),
      }));
      setCircles(newCircles);
    } else if (activeTimer) {
      setCircles(prev => prev.map((circle, i) => ({
        ...circle,
        color: colors[i % colors.length],
      })));
    }
  }, [activeTimerId, theme, activeTimer, isSafari]);

  return (
    <AutoTransition
      transitionKey={backgroundType === 'custom' ? 'gradient-hidden' : 'gradient-visible'}
      initial={false}
      type="crossFade"
      className="fixed inset-0 overflow-hidden z-0 pointer-events-none"
    >
    {backgroundType !== 'custom' ? <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <AutoTransition transitionKey={`gradient-circles-${activeTimerId || 'default'}`} initial={false} type="crossFade">
      <AnimatePresence>
        {circles.map(circle => (
          <motion.div
            key={`circle-${circle.id}-${activeTimerId || 'default'}`}
            className="moving-circle absolute"
            initial={{
              left: `${circle.x}vw`,
              top: `${circle.y}vh`,
              width: `${circle.size}vw`,
              height: `${circle.size}vw`,
              opacity: 0,
            }}
            animate={{
              left: [`${circle.x}vw`, `${circle.x + circle.speedX * 100}vw`],
              top: [`${circle.y}vh`, `${circle.y + circle.speedY * 100}vh`],
              backgroundColor: circle.color,
              filter: `blur(${circle.blur}px)`,
              opacity: circle.opacity,
            }}
            transition={{
              left: { duration: isSafari ? 30 : 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' },
              top: { duration: isSafari ? 30 : 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' },
              backgroundColor: { duration: isSafari ? 3.5 : 2.5, ease: 'easeOut' },
              opacity: { duration: isSafari ? 1.2 : 0.8 },
            }}
            style={{
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          />
        ))}
      </AnimatePresence>
      </AutoTransition>

      <AutoTransition transitionKey={activeTimerId !== prevTimerId && prevTimerId !== null ? `gradient-flare-${activeTimerId || 'default'}` : 'gradient-no-flare'} initial={false} type="fade">
      {activeTimerId !== prevTimerId && prevTimerId !== null ? (
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${activeTimer?.color || '#0ea5e9'}05 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          onAnimationComplete={() => setPrevTimerId(activeTimerId)}
        />
      ) : null}
      </AutoTransition>
    </div> : null}
    </AutoTransition>
  );
}
