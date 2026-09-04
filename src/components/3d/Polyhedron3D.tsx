import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../lib/theme';

export interface Polyhedron3DProps {
  /** Hex or RGB color for wireframe lines */
  wireColor?: string;
  /** Hex or RGB color for vertex node dots */
  dotColor?: string;
  /** Inner glowing core or extra nested polyhedron */
  nested?: boolean;
  /** Relative scale multiplier (default 1.0) */
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
 * Pure mathematical Icosahedron wireframe projection that automatically
 * fits within its container with zero clipping or awkward bounding box cutoff.
 */
export function Polyhedron3D({
  wireColor,
  dotColor,
  nested = true,
  size = 1.0,
  speed = 1.0,
  interactive = false,
  className = '',
  style = {},
}: Polyhedron3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const defaultWire = isDark ? '#e5c378' : '#c4972a';
  const activeWire = wireColor || defaultWire;
  const activeDot = dotColor || (isDark ? '#fff0c0' : '#8a6a00');

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
    let isIntersecting = false;
    let cachedWidth = canvas.clientWidth || 100;
    let cachedHeight = canvas.clientHeight || 100;

    // Golden ratio
    const t = (1 + Math.sqrt(5)) / 2;
    // Vertex normalization constant (max distance from origin = sqrt(1 + t^2) ≈ 1.90211)
    const vertexNorm = Math.sqrt(1 + t * t);

    // Normalized outer icosahedron vertices (unit radius = 1)
    const rawVertices = [
      [-1 / vertexNorm,  t / vertexNorm,  0],
      [ 1 / vertexNorm,  t / vertexNorm,  0],
      [-1 / vertexNorm, -t / vertexNorm,  0],
      [ 1 / vertexNorm, -t / vertexNorm,  0],
      [ 0, -1 / vertexNorm,  t / vertexNorm],
      [ 0,  1 / vertexNorm,  t / vertexNorm],
      [ 0, -1 / vertexNorm, -t / vertexNorm],
      [ 0,  1 / vertexNorm, -t / vertexNorm],
      [ t / vertexNorm,  0, -1 / vertexNorm],
      [ t / vertexNorm,  0,  1 / vertexNorm],
      [-t / vertexNorm,  0, -1 / vertexNorm],
      [-t / vertexNorm,  0,  1 / vertexNorm],
    ];

    // Compute edges where euclidean distance is ~ (2 / vertexNorm) ≈ 1.05146
    const edgeTarget = 2 / vertexNorm;
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < rawVertices.length; i++) {
      for (let j = i + 1; j < rawVertices.length; j++) {
        const dx = rawVertices[i][0] - rawVertices[j][0];
        const dy = rawVertices[i][1] - rawVertices[j][1];
        const dz = rawVertices[i][2] - rawVertices[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (Math.abs(dist - edgeTarget) < 0.08) {
          edges.push([i, j]);
        }
      }
    }

    // Inner nested icosahedron vertices (scaled down 0.52x)
    const innerVertices = rawVertices.map(([x, y, z]) => [x * 0.52, y * 0.52, z * 0.52]);

    const renderFrame = (now: number) => {
      const width = cachedWidth;
      const height = cachedHeight;
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
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
      const minDim = Math.min(width, height);

      // Normalize size scale factor so the model NEVER exceeds container bounds
      // If user passed a large pixel value like 180 or 120, convert it to a relative proportion, else use scale multiplier
      const scaleMultiplier = size > 5 ? (size / Math.max(width, 1)) * 0.8 : (typeof size === 'number' ? size : 1.0);
      // Safe base radius = 38% of container dimension, leaving 12% margin around edges
      const baseRadius = minDim * 0.38 * Math.min(scaleMultiplier, 1.0);

      const fov = minDim * 2.5;

      // Project vertices to 2D screen space
      const projectSet = (verts: number[][]) => {
        return verts.map(([vx, vy, vz]) => {
          // Rotate Y
          let x = vx * Math.cos(angleY) + vz * Math.sin(angleY);
          let z = -vx * Math.sin(angleY) + vz * Math.cos(angleY);
          let y = vy;

          // Rotate X
          const yRot = y * Math.cos(angleX) - z * Math.sin(angleX);
          z = y * Math.sin(angleX) + z * Math.cos(angleX);
          y = yRot;

          // Perspective division
          const scale = fov / (fov + z * baseRadius);
          return {
            x: cx + x * baseRadius * scale,
            y: cy + y * baseRadius * scale,
            z: z,
          };
        });
      };

      const outerPoints = projectSet(rawVertices);

      // Line width adapted to canvas size
      const baseLineWidth = Math.max(1, Math.min(2, minDim * 0.015));
      ctx.lineWidth = baseLineWidth;
      ctx.strokeStyle = activeWire;

      // Draw outer edges with depth-dependent alpha
      edges.forEach(([i, j]) => {
        const p1 = outerPoints[i];
        const p2 = outerPoints[j];
        const avgZ = (p1.z + p2.z) / 2;
        const alpha = Math.max(0.15, Math.min(1.0, (avgZ + 1.2) / 2.4));
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw outer vertex nodes (Titik Simpul)
      const dotRadius = Math.max(1.8, Math.min(3.5, minDim * 0.028));
      outerPoints.forEach((p) => {
        const alpha = Math.max(0.25, (p.z + 1.2) / 2.4);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = activeDot;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glowing halo on foreground nodes
        if (p.z > 0.3 && minDim > 80) {
          ctx.globalAlpha = alpha * 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotRadius * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Nested inner core polyhedron for bespoke aesthetic
      if (nested && minDim >= 60) {
        const innerPoints = projectSet(innerVertices);
        ctx.lineWidth = Math.max(0.8, baseLineWidth * 0.7);

        edges.forEach(([i, j]) => {
          const p1 = innerPoints[i];
          const p2 = innerPoints[j];
          const avgZ = (p1.z + p2.z) / 2;
          const alpha = Math.max(0.08, Math.min(0.5, (avgZ + 1.2) / 2.4));
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        });

        innerPoints.forEach((p) => {
          const alpha = Math.max(0.15, (p.z + 1.2) / 2.4);
          ctx.globalAlpha = alpha * 0.6;
          ctx.fillStyle = activeDot;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.2, dotRadius * 0.6), 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();
    };

    const handleResize = () => {
      cachedWidth = canvas.clientWidth || 100;
      cachedHeight = canvas.clientHeight || 100;
      renderFrame(performance.now());
    };
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
        } else if (!isIntersecting && wasIntersecting) {
          cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(canvas);

    // Mouse / Touch interaction handlers (if interactive)
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

    if (interactive) {
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (interactive) {
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
    };
  }, [activeWire, activeDot, size, speed, nested, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block bg-transparent pointer-events-none ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        backgroundColor: 'transparent',
        ...style,
      }}
    />
  );
}

export default Polyhedron3D;
