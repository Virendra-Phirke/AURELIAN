import React, { useRef, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';

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
  glareColor = 'rgba(229, 195, 120, 0.15)',
  maxTilt = 12,
  perspective = 800,
  scale = 1.03,
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

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
      opacity: 0.6,
    });
  }, [rotateX, rotateY, maxTilt]);

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
    ([rx, ry]: number[]) =>
      `${ry * -0.8}px ${rx * 0.8}px 30px rgba(0,0,0,0.3), 0 0 ${isHovered ? '20px' : '0px'} rgba(229,195,120,0.1)`
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
      {/* Gold rim on hover */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(229,195,120,${isHovered ? 0.3 : 0})`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      {children}
    </motion.div>
  );
}
