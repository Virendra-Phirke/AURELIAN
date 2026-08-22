import React, { useRef, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';
import { useTheme } from '../../lib/theme';

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glareColor?: string;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
}

export function TiltCard3D({
  children,
  className = '',
  style,
  glareColor,
  maxTilt = 10,
  perspective = 800,
  scale = 1.025,
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const defaultGlare = isDark ? 'rgba(229, 195, 120, 0.15)' : 'rgba(255, 255, 255, 0.5)';
  const activeGlare = glareColor || defaultGlare;

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scaleVal = useMotionValue(1);

  const rotateXSpring = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const rotateYSpring = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const scaleSpring = useSpring(scaleVal, { stiffness: 200, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    rotateY.set(normX * maxTilt);
    rotateX.set(-normY * maxTilt);

    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: isDark ? 0.6 : 0.8,
    });
  }, [rotateX, rotateY, maxTilt, isDark]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    scaleVal.set(scale);
  }, [scale, scaleVal]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    scaleVal.set(1);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  }, [rotateX, rotateY, scaleVal]);

  const shadow = useTransform(
    [rotateXSpring, rotateYSpring],
    ([rx, ry]: number[]) => {
      if (isDark) {
        return `${ry * -0.8 + 8}px ${rx * 0.8 + 8}px 32px rgba(0,0,0,0.7), ${ry * 0.8 - 4}px ${rx * -0.8 - 4}px 16px rgba(229,195,120,0.03), inset 0 1px 1px rgba(255,255,255,0.08), 0 0 ${isHovered ? '24px' : '0px'} rgba(229,195,120,0.15)`;
      }
      return `${ry * -0.8 + 8}px ${rx * 0.8 + 8}px 24px rgba(190, 175, 145, 0.25), ${ry * 0.8 - 8}px ${rx * -0.8 - 8}px 24px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1), 0 0 ${isHovered ? '20px' : '0px'} rgba(196,151,42,0.15)`;
    }
  );

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective,
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        scale: scaleSpring,
        boxShadow: shadow,
        transformStyle: 'preserve-3d',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        ...style,
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Dynamic glare overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor} 0%, transparent 60%)`,
          opacity: glarePos.opacity,
        }}
      />
      {/* Frosted glass top edge reflection */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), rgba(229,195,120,0.3), rgba(255,255,255,0.15), transparent)',
        }}
      />
      {/* Gold rim on hover */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(229,195,120,${isHovered ? 0.35 : 0})`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      {children}
    </motion.div>
  );
}
