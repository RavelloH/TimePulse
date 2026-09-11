import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBackground } from '@/app/providers/BackgroundProvider';
import imageStorage from '@/services/imageStorage';
import type { BackgroundMode } from '../settings';
import { AutoTransition } from '@/components/ui';

type StoredImage = {
  url: string;
};

export default function CustomBackground() {
  const {
    customBackgroundId,
    backgroundMode,
    bgOpacity,
    blurAmount,
  } = useBackground();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customBackgroundId) {
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    const loadImage = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const imageData = await imageStorage.getImage(customBackgroundId) as StoredImage | null;
        if (imageData) {
          setImageUrl(imageData.url);
        } else {
          setError('未找到背景图片');
        }
      } catch (err: unknown) {
        console.error('加载背景图片失败:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    void loadImage();
  }, [customBackgroundId]);

  const getBackgroundStyle = (): {
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundRepeat?: string;
  } => {
    if (!imageUrl) return {};

    switch (backgroundMode) {
      case 'contain':
        return {
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      case 'repeat':
        return {
          backgroundSize: 'auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        };
      case 'cover':
      default:
        return {
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
    }
  };

  return (
    <AutoTransition
      transitionKey={imageUrl && customBackgroundId && !isLoading && !error ? `custom-background-${customBackgroundId}` : 'custom-background-empty'}
      initial={false}
      type="crossFade"
      className="fixed inset-0 overflow-hidden z-0 pointer-events-none"
    >
      {imageUrl && customBackgroundId && !isLoading && !error ? (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            key={customBackgroundId}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              backgroundImage: `url(${imageUrl})`,
              ...getBackgroundStyle(),
              filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
            }}
          />
        </div>
      ) : null}

      {/* 遮罩层 - 确保文字可读性 */}
      {imageUrl && customBackgroundId && !isLoading && !error ? (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: bgOpacity }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 1)',
          }}
        />
      ) : null}
    </AutoTransition>
  );
}
