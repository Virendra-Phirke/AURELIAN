import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../lib/theme';

export interface Polyhedron3DProps {
  /** Hex or RGB color for wireframe lines */
  wireColor?: string;
  /** Hex or RGB color for vertex node dots */
  dotColor?: string;
  /** Inner glowing core or extra nested polyhedron */
  nested?: boolean;
  /** Base scale size of the polyhedron */
  size?: number;
  /** Rotation speed multiplier */
  speed?: number;
  /** Enable mouse/touch drag interactive rotation */
  interactive?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Custom canvas style */
  style?: React.CSSProperties;
}

/**
 * Polyhedron3D Component
 * Directly implementing the mathematical Icosahedron wireframe projection
 * from https://framer.com/m/Polyhedron-xMDsFB.js@Mz68XkceecyOpV0kRceV
 */
export function Polyhedron3D({
  wireColor,
  dotColor,
  nested = true,
  size = 280,
  speed = 1,
  interactive = true,
  className = '',
  style = {},
}: Polyhedron3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'system';

  const defaultWire = isDark ? '#e5c378' : '#c4972a';
  const activeWire = wireColor || defaultWire;
  const activeDot = dotColor || activeWire;

  const mouseOffset = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();
    let isIntersecting = true;

    // Golden ratio
    const t = (1 + Math.sqrt(5)) / 2;

    // Outer icosahedron vertices (normalized)
    const rawVertices = [
      [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
      [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
      [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1],
    ];

    // Compute edges based on euclidean distance between vertices ~ 2
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < rawVertices.length; i++) {
      for (let j = i + 1; j < rawVertices.length; j++) {
        const dx = rawVertices[i][0] - rawVertices[j][0];
        const dy = rawVertices[i][1] - rawVertices[j][1];
        const dz = rawVertices[i][2] - rawVertices[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (Math.abs(dist - 2) < 0.1) {
          edges.push([i, j]);
        }
      }
    }

    // Inner nested icosahedron vertices (scaled down 0.55x)
    const innerVertices = rawVertices.map(([x, y, z]) => [x * 0.55, y * 0.55, z * 0.55]);

    const renderFrame = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse dampen
      mouseOffset.current.x += (mouseOffset.current.targetX - mouseOffset.current.x) * 0.05;
      mouseOffset.current.y += (mouseOffset.current.targetY - mouseOffset.current.y) * 0.05;

      const elapsed = (now - startTime) * 0.0008 * speed;
      const angleX = elapsed * 0.7 + dragRotation.current.y + mouseOffset.current.y * 0.3;
      const angleY = elapsed * 1.1 + dragRotation.current.x + mouseOffset.current.x * 0.3;

      const cx = width / 2;
      const cy = height / 2;
      const fov = 400;

      // Project vertices to 2D screen space
      const projectSet = (verts: number[][], currentSize: number) => {
        return verts.map(([vx, vy, vz]) => {
          // Rotate Y
          let x = vx * Math.cos(angleY) + vz * Math.sin(angleY);
          let z = -vx * Math.sin(angleY) + vz * Math.cos(angleY);
          let y = vy;

          // Rotate X
          const yRot = y * Math.cos(angleX) - z * Math.sin(angleX);
          z = y * Math.sin(angleX) + z * Math.cos(angleX);
          y = yRot;

          const scale = fov / (fov + z * (currentSize / 2));
          return {
            x: cx + x * (currentSize / 2) * scale,
            y: cy + y * (currentSize / 2) * scale,
            z: z,
          };
        });
      };

      const outerPoints = projectSet(rawVertices, size);

      // Draw outer edges
      ctx.strokeStyle = activeWire;
      ctx.lineWidth = 1.5;

      edges.forEach(([i, j]) => {
        const p1 = outerPoints[i];
        const p2 = outerPoints[j];
        const avgZ = (p1.z + p2.z) / 2;
        const alpha = Math.max(0.12, Math.min(1, (avgZ + 2) / 4));
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw outer vertex nodes (Titik Simpul)
      outerPoints.forEach((p) => {
        const alpha = Math.max(0.25, (p.z + 2) / 4);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = activeDot;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow aura on closer vertices
        if (p.z > 0.4) {
          ctx.globalAlpha = alpha * 0.35;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Nested inner core polyhedron for ultra-luxury aesthetic
      if (nested) {
        const innerPoints = projectSet(innerVertices, size);
        ctx.lineWidth = 1.0;

        edges.forEach(([i, j]) => {
          const p1 = innerPoints[i];
          const p2 = innerPoints[j];
          const avgZ = (p1.z + p2.z) / 2;
          const alpha = Math.max(0.08, Math.min(0.6, (avgZ + 2) / 4));
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        });

        innerPoints.forEach((p) => {
          const alpha = Math.max(0.15, (p.z + 2) / 4);
          ctx.globalAlpha = alpha * 0.7;
          ctx.fillStyle = activeDot;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();
    };

    const handleResize = () => renderFrame(performance.now());
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    const draw = (now: number) => {
      renderFrame(now);
      if (isIntersecting) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        const wasIntersecting = isIntersecting;
        isIntersecting = entry.isIntersecting;
        if (isIntersecting && !wasIntersecting) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(draw);
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(canvas);

    animationFrameId = requestAnimationFrame(draw);

    // Mouse / Touch interaction handlers
    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      if (isDragging.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        dragRotation.current.x += dx * 0.008;
        dragRotation.current.y += dy * 0.008;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else {
        const rect = canvas.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        mouseOffset.current.targetX = nx * 1.5;
        mouseOffset.current.targetY = ny * 1.5;
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!interactive || !isDragging.current || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      dragRotation.current.x += dx * 0.01;
      dragRotation.current.y += dy * 0.01;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeWire, activeDot, size, speed, nested, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block bg-transparent cursor-grab active:cursor-grabbing ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        backgroundColor: 'transparent',
        touchAction: 'none',
        ...style,
      }}
    />
  );
}

export default Polyhedron3D;
