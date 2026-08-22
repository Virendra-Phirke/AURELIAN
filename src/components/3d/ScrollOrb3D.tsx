import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme';
import { Polyhedron3D } from './Polyhedron3D';

interface ScrollOrb3DProps {
  /** Size of canvas in pixels */
  size?: number;
  /** Geometry variant */
  variant?: 'polyhedron' | 'orb' | 'ring' | 'diamond' | 'helix' | 'star';
  /** Position side for layout */
  side?: 'left' | 'right' | 'center';
  /** Rotation speed multiplier */
  speed?: number;
  /** Custom className */
  className?: string;
}

/**
 * Lightweight inline 3D accent — a single rotating geometry
 * rendered in a small canvas, used to add section-level 3D flair.
 */
export function ScrollOrb3D({
  size = 120,
  variant = 'polyhedron',
  speed = 1,
  className = '',
}: ScrollOrb3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  // If polyhedron variant, render using the requested Polyhedron3D component
  if (variant === 'polyhedron') {
    return (
      <div style={{ width: size, height: size }} className={`shrink-0 pointer-events-none ${className}`}>
        <Polyhedron3D
          size={size * 0.85}
          speed={speed}
          nested={true}
          interactive={false}
        />
      </div>
    );
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isDark = themeRef.current === 'dark' || themeRef.current === 'system';
    const primary = isDark ? 0xe5c378 : 0xc4972a;
    const emissive = isDark ? 0x3d3010 : 0x8a6a00;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4;

    // Lighting
    const ambient = new THREE.AmbientLight(primary, 0.5);
    scene.add(ambient);
    const point = new THREE.PointLight(primary, isDark ? 3 : 1.5, 20);
    point.position.set(3, 3, 3);
    scene.add(point);
    const point2 = new THREE.PointLight(0xffffff, isDark ? 0.8 : 1.2, 15);
    point2.position.set(-3, -2, 2);
    scene.add(point2);

    // Geometry selection
    let geo: THREE.BufferGeometry;
    switch (variant) {
      case 'ring':
        geo = new THREE.TorusGeometry(1.2, 0.35, 12, 48);
        break;
      case 'diamond':
        geo = new THREE.OctahedronGeometry(1.4, 0);
        break;
      case 'helix':
        geo = new THREE.TorusKnotGeometry(0.8, 0.28, 80, 12, 2, 3);
        break;
      case 'star':
        geo = new THREE.IcosahedronGeometry(1.3, 1);
        break;
      default: // orb
        geo = new THREE.IcosahedronGeometry(1.2, 1);
        break;
    }

    const mat = new THREE.MeshStandardMaterial({
      color: primary,
      emissive,
      emissiveIntensity: isDark ? 0.6 : 0.2,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: isDark ? 0.85 : 0.65,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Outer wireframe shell for layered depth
    const wireMat = new THREE.MeshBasicMaterial({
      color: primary,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.2 : 0.12,
    });
    const wireScale = variant === 'ring' ? 1.15 : 1.3;
    const wireMesh = new THREE.Mesh(geo.clone(), wireMat);
    wireMesh.scale.setScalar(wireScale);
    scene.add(wireMesh);

    let t = Math.random() * Math.PI * 2;
    const animate = () => {
      const raf = requestAnimationFrame(animate);
      t += 0.012 * speed;

      mesh.rotation.x = t * 0.6;
      mesh.rotation.y = t * 0.9;
      wireMesh.rotation.x = -t * 0.4;
      wireMesh.rotation.y = t * 0.7;

      // Breathing scale
      const s = 1 + Math.sin(t * 1.5) * 0.04;
      mesh.scale.setScalar(s);
      wireMesh.scale.setScalar(wireScale * s);

      renderer.render(scene, camera);
      return raf;
    };
    const raf = animate();

    return () => {
      cancelAnimationFrame(raf);
      geo.dispose();
      mat.dispose();
      wireMat.dispose();
      renderer.dispose();
    };
  }, [variant, size, speed, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`pointer-events-none ${className}`}
      style={{ display: 'block' }}
    />
  );
}
