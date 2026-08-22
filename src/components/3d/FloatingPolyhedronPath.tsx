import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Polyhedron3D } from './Polyhedron3D';

/**
 * FloatingPolyhedronPath
 * Renders multiple golden polyhedrons that travel along sweeping diagonal
 * paths (left-to-right, right-to-left, top-to-bottom) across the viewport
 * driven by page scroll progress.
 */
export function FloatingPolyhedronPath() {
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setScrollContainer(document.getElementById('landing-scroll'));
  }, []);

  const { scrollYProgress } = useScroll({
    container: scrollContainer ? { current: scrollContainer } : undefined,
  });

  // Smooth out the scroll progress with spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    restDelta: 0.001,
  });

  // ─────────────────────────────────────────────────────────────
  // Polyhedron 1: Sweeping diagonal from Top-Left to Mid-Right to Bottom-Left
  // ─────────────────────────────────────────────────────────────
  const x1 = useTransform(smoothProgress, [0, 0.35, 0.7, 1.0], ['-4vw', '80vw', '10vw', '75vw']);
  const y1 = useTransform(smoothProgress, [0, 0.35, 0.7, 1.0], ['12vh', '42vh', '68vh', '88vh']);
  const scale1 = useTransform(smoothProgress, [0, 0.35, 0.7, 1.0], [0.9, 1.25, 0.95, 1.1]);
  const opacity1 = useTransform(smoothProgress, [0, 0.05, 0.92, 1.0], [0.4, 0.85, 0.85, 0.3]);
  const rotate1 = useTransform(smoothProgress, [0, 1], [0, 360]);

  // ─────────────────────────────────────────────────────────────
  // Polyhedron 2: Inverse diagonal from Top-Right to Mid-Left to Bottom-Right
  // ─────────────────────────────────────────────────────────────
  const x2 = useTransform(smoothProgress, [0, 0.3, 0.65, 1.0], ['88vw', '6vw', '78vw', '12vw']);
  const y2 = useTransform(smoothProgress, [0, 0.3, 0.65, 1.0], ['22vh', '50vh', '75vh', '92vh']);
  const scale2 = useTransform(smoothProgress, [0, 0.3, 0.65, 1.0], [1.15, 0.85, 1.2, 0.9]);
  const opacity2 = useTransform(smoothProgress, [0, 0.08, 0.9, 1.0], [0.35, 0.8, 0.8, 0.35]);
  const rotate2 = useTransform(smoothProgress, [0, 1], [360, 0]);

  // ─────────────────────────────────────────────────────────────
  // Polyhedron 3: Mid-depth floating diagonal accent
  // ─────────────────────────────────────────────────────────────
  const x3 = useTransform(smoothProgress, [0.15, 0.5, 0.85], ['15vw', '82vw', '25vw']);
  const y3 = useTransform(smoothProgress, [0.15, 0.5, 0.85], ['30vh', '58vh', '82vh']);
  const scale3 = useTransform(smoothProgress, [0.15, 0.5, 0.85], [0.75, 1.1, 0.8]);
  const opacity3 = useTransform(smoothProgress, [0.1, 0.25, 0.75, 0.9], [0, 0.75, 0.75, 0]);

  return (
    <div className="fixed inset-0 pointer-events-none z-15 overflow-hidden">
      {/* Traveler 1 (Large - Left to Right Diagonal) */}
      <motion.div
        className="absolute will-change-transform"
        style={{
          left: x1,
          top: y1,
          scale: scale1,
          opacity: opacity1,
          rotate: rotate1,
          width: 140,
          height: 140,
        }}
      >
        <Polyhedron3D size={1.0} speed={1.2} nested={true} />
      </motion.div>

      {/* Traveler 2 (Medium - Right to Left Diagonal) */}
      <motion.div
        className="absolute will-change-transform"
        style={{
          left: x2,
          top: y2,
          scale: scale2,
          opacity: opacity2,
          rotate: rotate2,
          width: 110,
          height: 110,
        }}
      >
        <Polyhedron3D size={1.0} speed={0.9} nested={true} />
      </motion.div>

      {/* Traveler 3 (Accent - Crossing Mid Diagonal) */}
      <motion.div
        className="absolute will-change-transform"
        style={{
          left: x3,
          top: y3,
          scale: scale3,
          opacity: opacity3,
          width: 85,
          height: 85,
        }}
      >
        <Polyhedron3D size={1.0} speed={1.5} nested={false} />
      </motion.div>
    </div>
  );
}

export default FloatingPolyhedronPath;
