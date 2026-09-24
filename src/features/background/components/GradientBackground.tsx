import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTimers } from '@/app/providers/TimerProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useBackground } from '@/app/providers/BackgroundProvider';
import { AutoTransition } from '@/components/ui';
import GradientShaderCanvas, {
  GRADIENT_CIRCLE_COUNT,
  type GradientCircle,
} from './GradientShaderCanvas';

const randomDriftSpeed = (): number => (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 12);

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function rgbToHsl(red: number, green: number, blue: number): [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  const lightness = (max + min) / 2;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    switch (max) {
      case r:
        hue = ((g - b) / delta) % 6;
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return [hue, saturation, lightness];
}

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hueSection = hue / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const offset = lightness - chroma / 2;
  let channels: [number, number, number];

  if (hueSection < 1) channels = [chroma, secondary, 0];
  else if (hueSection < 2) channels = [secondary, chroma, 0];
  else if (hueSection < 3) channels = [0, chroma, secondary];
  else if (hueSection < 4) channels = [0, secondary, chroma];
  else if (hueSection < 5) channels = [secondary, 0, chroma];
  else channels = [chroma, 0, secondary];

  return channels.map(channel => Math.round((channel + offset) * 255)) as [number, number, number];
}

const getColors = (baseColor: string, _isDark: boolean): string[] => {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(baseColor)?.[1];
  const normalizedHex = hex?.length === 3 ? [...hex].map(channel => channel + channel).join('') : hex;
  const baseRgb = normalizedHex
    ? [0, 2, 4].map(index => parseInt(normalizedHex.slice(index, index + 2), 16))
    : [14, 165, 233];
  const [baseHue, baseSaturation, baseLightness] = rgbToHsl(baseRgb[0], baseRgb[1], baseRgb[2]);
  const hueOffsets = [-42, -30, -18, -6, 6, 18, 30, 42];
  const lightnessOffsets = [0.025, -0.02, 0.04, -0.035, 0.015, -0.03, 0.05, -0.045];
  const saturation = clamp(baseSaturation * 0.9 + 0.1, 0.62, 0.9);

  return hueOffsets.map((offset, index) => {
    const hue = (baseHue + offset + 360) % 360;
    const lightness = clamp(baseLightness + lightnessOffsets[index], 0.3, 0.7);
    const [red, green, blue] = hslToRgb(hue, saturation, lightness);
    return `rgba(${red}, ${green}, ${blue}, 0.5)`;
  });
};

export default function GradientBackground() {
  const { getActiveTimer, activeTimerId } = useTimers();
  const { theme } = useTheme();
  const { backgroundType } = useBackground();
  const [circles, setCircles] = useState<GradientCircle[]>([]);
  const [prevTimerId, setPrevTimerId] = useState<string | null>(null);
  const [renderer, setRenderer] = useState<'webgl' | 'css'>('webgl');
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth,
  );
  const previousLayoutRef = useRef<boolean | null>(null);
  const activeTimer = getActiveTimer();
  const handleRendererUnavailable = useCallback(() => setRenderer('css'), []);
  const motionDuration = 20;
  const viewportWidth = typeof window === 'undefined' ? 1 : Math.max(window.innerWidth, 1);
  const viewportHeight = typeof window === 'undefined' ? 1 : Math.max(window.innerHeight, 1);

  useEffect(() => {
    const updateOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  // 生成渐变圆圈
  useEffect(() => {
    const isNewTimer = activeTimerId !== prevTimerId;
    const isLayoutChange = previousLayoutRef.current !== null && previousLayoutRef.current !== isPortrait;
    previousLayoutRef.current = isPortrait;
    if (isNewTimer) {
      setPrevTimerId(activeTimerId);
    }

    const baseColor = activeTimer?.color || '#0ea5e9';
    const colors = getColors(baseColor, theme === 'dark');

    // 生成或更新圆圈配置
    if (circles.length === 0 || isNewTimer || isLayoutChange) {
      const columnCount = isPortrait ? 2 : 4;
      const rowCount = GRADIENT_CIRCLE_COUNT / columnCount;
      const cellWidth = 100 / columnCount;
      const cellHeight = 100 / rowCount;
      const newCircles = Array.from({ length: GRADIENT_CIRCLE_COUNT }, (_, i): GradientCircle => {
        const column = i % columnCount;
        const row = Math.floor(i / columnCount);
        const centerX = (column + 0.5) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.32;
        const centerY = (row + 0.5) * cellHeight + (Math.random() - 0.5) * cellHeight * 0.32;
        const size = 30 + Math.random() * 40;

        return {
          id: i,
          x: centerX - size / 2,
          y: centerY - (size * viewportWidth) / viewportHeight / 2,
          size,
          driftX: randomDriftSpeed(),
          driftY: randomDriftSpeed(),
          color: colors[i % colors.length],
          blur: 60 + Math.random() * 40,
          opacity: 0.08 + Math.random() * 0.1,
        };
      });
      setCircles(newCircles);
    } else if (activeTimer) {
      setCircles(prev => prev.map((circle, i) => ({
        ...circle,
        color: colors[i % colors.length],
      })));
    }
  }, [activeTimerId, theme, activeTimer, circles.length, isPortrait]);

  return (
    <AutoTransition
      transitionKey={backgroundType === 'custom' ? 'gradient-hidden' : 'gradient-visible'}
      initial={false}
      type="crossFade"
      className="fixed inset-0 overflow-hidden z-0 pointer-events-none"
    >
    {backgroundType !== 'custom' ? <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <AutoTransition transitionKey={`gradient-circles-${activeTimerId || 'default'}`} initial={false} type="crossFade">
      {renderer === 'webgl' ? (
        <GradientShaderCanvas
          circles={circles}
          onUnavailable={handleRendererUnavailable}
        />
      ) : (
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
                left: [`${circle.x}vw`, `${circle.x + (circle.driftX * motionDuration * 100) / viewportWidth}vw`],
                top: [`${circle.y}vh`, `${circle.y + (circle.driftY * motionDuration * 100) / viewportHeight}vh`],
                backgroundColor: circle.color,
                filter: `blur(${circle.blur}px)`,
                opacity: circle.opacity,
              }}
              transition={{
                left: { duration: motionDuration, ease: 'linear', repeat: Infinity, repeatType: 'reverse' },
                top: { duration: motionDuration, ease: 'linear', repeat: Infinity, repeatType: 'reverse' },
                backgroundColor: { duration: 2.5, ease: 'easeOut' },
                opacity: { duration: 0.8 },
              }}
              style={{
                WebkitTransform: 'translateZ(0)',
                transform: 'translateZ(0)',
                willChange: 'transform',
              }}
            />
          ))}
        </AnimatePresence>
      )}
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
