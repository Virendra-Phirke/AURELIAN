import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

interface SparklesTextProps {
  text: string;
  className?: string;
  sparklesCount?: number;
  colors?: { first: string; second: string };
}

export function SparklesText({
  text,
  className,
  sparklesCount = 6,
  colors = { first: '#E5C378', second: '#FFFFFF' },
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const generateSparkles = () => {
      return Array.from({ length: sparklesCount }).map((_, i) => ({
        id: `${i}-${Date.now()}`,
        x: `${Math.floor(Math.random() * 95)}%`,
        y: `${Math.floor(Math.random() * 85)}%`,
        color: Math.random() > 0.5 ? colors.first : colors.second,
        delay: Math.random() * 2,
        scale: Math.random() * 0.8 + 0.6,
        lifespan: Math.random() * 2 + 1.5,
      }));
    };
    setSparkles(generateSparkles());
  }, [sparklesCount, colors.first, colors.second]);

  return (
    <div className={cn('relative inline-block', className)}>
      <span className="relative z-10">{text}</span>
      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          className="pointer-events-none absolute z-20"
          style={{ left: s.x, top: s.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, s.scale, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: s.lifespan,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 160 160" fill="none">
            <path
              d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
              fill={s.color}
            />
          </svg>
        </motion.span>
      ))}
    </div>
  );
}
