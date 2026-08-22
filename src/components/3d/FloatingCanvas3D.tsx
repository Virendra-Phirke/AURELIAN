import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme';

interface FloatingObject {
  mesh: THREE.Mesh | THREE.Line;
  rotationSpeed: THREE.Vector3;
  floatOffset: number;
  floatSpeed: number;
  floatAmplitude: number;
  originalY: number;
  originalX: number;
  originalZ: number;
  parallaxFactor: number;
  driftX: number;
  driftZ: number;
}

export function FloatingCanvas3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const animFrameRef = useRef<number>(0);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const objectsRef = useRef<FloatingObject[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef(0);
  const scrollMaxRef = useRef(1);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  const isDark = useCallback(() =>
    themeRef.current === 'dark' || themeRef.current === 'system', []);

  const getColors = useCallback(() => {
    const dark = isDark();
    return {
      bg: dark ? 0x060606 : 0xfaf8f5,
      primary: dark ? 0xe5c378 : 0xc4972a,
      secondary: dark ? 0xffffff : 0x1a1612,
      emissive: dark ? 0x3d3010 : 0x8a6a00,
      fog: dark ? 0x060606 : 0xfaf8f5,
    };
  }, [isDark]);

  const createMaterial = useCallback((type: 'wire' | 'glass' | 'metal' | 'neon', colors: ReturnType<typeof getColors>): THREE.Material => {
    const dark = isDark();
    if (type === 'wire') {
      return new THREE.MeshBasicMaterial({
        color: colors.primary,
        wireframe: true,
        transparent: true,
        opacity: dark ? 0.22 : 0.14,
      });
    }
    if (type === 'glass') {
      return new THREE.MeshPhysicalMaterial({
        color: colors.primary,
        transparent: true,
        opacity: dark ? 0.08 : 0.05,
        roughness: 0.02,
        metalness: 0.4,
        reflectivity: 1.0,
        side: THREE.DoubleSide,
      });
    }
    if (type === 'neon') {
      return new THREE.MeshStandardMaterial({
        color: colors.primary,
        emissive: colors.primary,
        emissiveIntensity: dark ? 0.8 : 0.3,
        metalness: 1.0,
        roughness: 0.1,
        transparent: true,
        opacity: dark ? 0.4 : 0.25,
      });
    }
    // metal
    return new THREE.MeshStandardMaterial({
      color: colors.primary,
      emissive: colors.emissive,
      emissiveIntensity: dark ? 0.5 : 0.15,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: dark ? 0.65 : 0.4,
    });
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera — wide FOV so side-rail objects fill left/right gutters
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.z = 26;

    // Lights
    const colors = getColors();
    const ambientLight = new THREE.AmbientLight(colors.primary, isDark() ? 0.4 : 0.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(colors.primary, isDark() ? 3 : 1.5, 80);
    pointLight1.position.set(15, 15, 15);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, isDark() ? 0.8 : 1.2, 60);
    pointLight2.position.set(-20, -15, 8);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(colors.primary, isDark() ? 1.5 : 0.8, 50);
    pointLight3.position.set(0, -30, 5);
    scene.add(pointLight3);

    const objects: FloatingObject[] = [];

    // ─────────────────────────────────────────────────────────────
    // Objects clustered at EXTREME LEFT (X < -20) and RIGHT (X > 20)
    // at CLOSE Z depth (-6 to -14) to fill the page side gutters.
    // Two "rails" run the full page height, one per side.
    // Y range: +12 (hero top) → -90 (footer bottom)
    // ─────────────────────────────────────────────────────────────
    const objectDefs: Array<{
      geo: THREE.BufferGeometry;
      type: 'wire' | 'glass' | 'metal' | 'neon';
      x: number; y: number; z: number;
      scale?: number;
    }> = [
      // ── LEFT RAIL — Hero ─────────────────────────────────────────
      { geo: new THREE.IcosahedronGeometry(1.6, 0),        type: 'metal',  x: -28, y:  10, z:  -8, scale: 1.8 },
      { geo: new THREE.TorusGeometry(1.2, 0.32, 10, 32),   type: 'wire',   x: -32, y:   4, z:  -6, scale: 1.6 },
      { geo: new THREE.OctahedronGeometry(1.4, 0),         type: 'neon',   x: -26, y:  -2, z: -10, scale: 1.5 },
      { geo: new THREE.DodecahedronGeometry(1.0, 0),       type: 'glass',  x: -30, y:  -8, z:  -7, scale: 2.0 },

      // ── RIGHT RAIL — Hero ────────────────────────────────────────
      { geo: new THREE.DodecahedronGeometry(1.3, 0),       type: 'neon',   x:  28, y:  10, z:  -9, scale: 1.7 },
      { geo: new THREE.IcosahedronGeometry(1.1, 0),        type: 'wire',   x:  32, y:   3, z:  -6, scale: 1.8 },
      { geo: new THREE.TorusGeometry(1.0, 0.28, 8, 28),    type: 'metal',  x:  26, y:  -3, z:  -8, scale: 1.6 },
      { geo: new THREE.OctahedronGeometry(1.5, 0),         type: 'glass',  x:  30, y:  -9, z: -11, scale: 1.4 },

      // ── LEFT RAIL — Atmosphere ───────────────────────────────────
      { geo: new THREE.TetrahedronGeometry(1.4, 0),        type: 'metal',  x: -28, y: -14, z:  -7, scale: 2.0 },
      { geo: new THREE.TorusGeometry(1.3, 0.30, 10, 30),   type: 'neon',   x: -32, y: -20, z:  -9, scale: 1.5 },
      { geo: new THREE.BoxGeometry(1.4, 1.4, 1.4),         type: 'wire',   x: -26, y: -26, z:  -6, scale: 1.7 },
      { geo: new THREE.IcosahedronGeometry(1.2, 0),        type: 'glass',  x: -30, y: -32, z:  -8, scale: 1.9 },

      // ── RIGHT RAIL — Atmosphere ──────────────────────────────────
      { geo: new THREE.SphereGeometry(1.2, 10, 10),        type: 'metal',  x:  28, y: -14, z:  -8, scale: 1.8 },
      { geo: new THREE.OctahedronGeometry(1.3, 0),         type: 'wire',   x:  32, y: -21, z:  -6, scale: 1.6 },
      { geo: new THREE.DodecahedronGeometry(1.1, 0),       type: 'neon',   x:  26, y: -27, z: -10, scale: 2.0 },
      { geo: new THREE.TorusGeometry(1.1, 0.26, 8, 26),    type: 'glass',  x:  30, y: -33, z:  -7, scale: 1.5 },

      // ── LEFT RAIL — Services ──────────────────────────────────────
      { geo: new THREE.ConeGeometry(1.1, 2.2, 7),          type: 'neon',   x: -28, y: -38, z:  -9, scale: 1.6 },
      { geo: new THREE.IcosahedronGeometry(1.5, 0),        type: 'metal',  x: -32, y: -44, z:  -7, scale: 1.8 },
      { geo: new THREE.TorusGeometry(1.2, 0.28, 10, 28),   type: 'wire',   x: -26, y: -50, z: -11, scale: 1.7 },
      { geo: new THREE.OctahedronGeometry(1.3, 0),         type: 'glass',  x: -30, y: -56, z:  -8, scale: 2.0 },

      // ── RIGHT RAIL — Services ────────────────────────────────────
      { geo: new THREE.TetrahedronGeometry(1.3, 0),        type: 'wire',   x:  28, y: -38, z:  -8, scale: 1.9 },
      { geo: new THREE.DodecahedronGeometry(1.4, 0),       type: 'glass',  x:  32, y: -44, z: -10, scale: 1.6 },
      { geo: new THREE.IcosahedronGeometry(1.0, 0),        type: 'neon',   x:  26, y: -50, z:  -7, scale: 2.2 },
      { geo: new THREE.TorusGeometry(1.3, 0.30, 10, 30),   type: 'metal',  x:  30, y: -56, z:  -9, scale: 1.5 },

      // ── LEFT RAIL — Craftsmanship ─────────────────────────────────
      { geo: new THREE.SphereGeometry(1.3, 12, 12),        type: 'neon',   x: -28, y: -62, z:  -8, scale: 1.7 },
      { geo: new THREE.BoxGeometry(1.5, 1.5, 1.5),         type: 'metal',  x: -32, y: -68, z:  -6, scale: 1.5 },
      { geo: new THREE.IcosahedronGeometry(1.4, 0),        type: 'wire',   x: -26, y: -74, z: -10, scale: 1.8 },
      { geo: new THREE.OctahedronGeometry(1.2, 0),         type: 'glass',  x: -30, y: -80, z:  -8, scale: 2.0 },

      // ── RIGHT RAIL — Craftsmanship ───────────────────────────────
      { geo: new THREE.DodecahedronGeometry(1.2, 0),       type: 'wire',   x:  28, y: -62, z:  -9, scale: 1.9 },
      { geo: new THREE.TorusGeometry(1.0, 0.24, 8, 24),    type: 'neon',   x:  32, y: -68, z:  -7, scale: 1.6 },
      { geo: new THREE.TetrahedronGeometry(1.5, 0),        type: 'metal',  x:  26, y: -74, z:  -8, scale: 1.7 },
      { geo: new THREE.IcosahedronGeometry(1.3, 0),        type: 'glass',  x:  30, y: -80, z: -11, scale: 1.5 },

      // ── EXTRA DEEP FILL — mid-page left (more coverage) ──────────
      { geo: new THREE.TorusGeometry(0.9, 0.22, 8, 22),    type: 'neon',   x: -35, y:   0, z: -12, scale: 2.2 },
      { geo: new THREE.OctahedronGeometry(1.0, 0),         type: 'wire',   x: -35, y: -16, z:  -9, scale: 2.0 },
      { geo: new THREE.DodecahedronGeometry(0.9, 0),       type: 'metal',  x: -35, y: -36, z: -10, scale: 2.1 },
      { geo: new THREE.IcosahedronGeometry(1.1, 0),        type: 'glass',  x: -35, y: -54, z:  -8, scale: 1.9 },
      { geo: new THREE.TorusGeometry(1.2, 0.28, 10, 26),   type: 'neon',   x: -35, y: -72, z: -11, scale: 2.0 },

      // ── EXTRA DEEP FILL — mid-page right (more coverage) ─────────
      { geo: new THREE.IcosahedronGeometry(1.1, 0),        type: 'wire',   x:  35, y:   0, z: -10, scale: 2.2 },
      { geo: new THREE.TorusGeometry(1.0, 0.26, 8, 24),    type: 'metal',  x:  35, y: -18, z:  -8, scale: 2.0 },
      { geo: new THREE.OctahedronGeometry(1.3, 0),         type: 'neon',   x:  35, y: -36, z: -12, scale: 1.8 },
      { geo: new THREE.DodecahedronGeometry(1.0, 0),       type: 'glass',  x:  35, y: -55, z:  -9, scale: 2.1 },
      { geo: new THREE.BoxGeometry(1.2, 1.2, 1.2),         type: 'wire',   x:  35, y: -72, z: -10, scale: 2.0 },

      // ── VERY CLOSE accent objects — peek at viewport edges ────────
      { geo: new THREE.IcosahedronGeometry(2.0, 0),        type: 'wire',   x: -38, y:   6, z:  -5, scale: 1.0 },
      { geo: new THREE.TorusGeometry(1.8, 0.40, 8, 32),    type: 'neon',   x:  38, y:   6, z:  -5, scale: 1.0 },
      { geo: new THREE.OctahedronGeometry(2.2, 0),         type: 'glass',  x: -38, y: -42, z:  -5, scale: 1.0 },
      { geo: new THREE.DodecahedronGeometry(1.8, 0),       type: 'metal',  x:  38, y: -42, z:  -5, scale: 1.0 },
      { geo: new THREE.IcosahedronGeometry(2.0, 0),        type: 'neon',   x: -38, y: -80, z:  -5, scale: 1.0 },
      { geo: new THREE.TorusGeometry(1.6, 0.35, 8, 28),    type: 'wire',   x:  38, y: -80, z:  -5, scale: 1.0 },
    ];


    objectDefs.forEach((def) => {
      const mat = createMaterial(def.type, colors);
      const mesh = new THREE.Mesh(def.geo, mat);
      mesh.position.set(def.x, def.y, def.z);
      if (def.scale && def.scale !== 1) mesh.scale.setScalar(def.scale);
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      // Add vertex nodes to polyhedra matching the Framer Polyhedron design
      if (def.type === 'wire' || def.type === 'neon') {
        const pointsMat = new THREE.PointsMaterial({
          color: colors.primary,
          size: 0.16,
          transparent: true,
          opacity: isDark() ? 0.85 : 0.6,
        });
        const pointsMesh = new THREE.Points(def.geo, pointsMat);
        mesh.add(pointsMesh);
      }

      scene.add(mesh);

      objects.push({
        mesh,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.003
        ),
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.25 + Math.random() * 0.5,
        floatAmplitude: 0.4 + Math.random() * 1.0,
        originalY: def.y,
        originalX: def.x,
        originalZ: def.z,
        parallaxFactor: 0.2 + Math.random() * 0.8,
        driftX: (Math.random() - 0.5) * 0.0004,
        driftZ: (Math.random() - 0.5) * 0.0003,
      });
    });

    objectsRef.current = objects;

    // ── Ambient particle field — spread across full height ──────
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3]     = (Math.random() - 0.5) * 100;
      pPositions[i * 3 + 1] = Math.random() * -100; // spread top to bottom
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: colors.primary,
      size: 0.07,
      transparent: true,
      opacity: isDark() ? 0.55 : 0.35,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Gossamer connecting lines between nearby objects ────────
    const lineMat = new THREE.LineBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: isDark() ? 0.06 : 0.04,
    });
    // Connect pairs of nearby objects with faint lines for depth
    const lineConnections = [[0,1],[2,3],[4,5],[6,7],[10,11],[14,15],[18,19],[24,25],[28,29],[32,33]];
    lineConnections.forEach(([a, b]) => {
      if (a < objectDefs.length && b < objectDefs.length) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(objectDefs[a].x, objectDefs[a].y, objectDefs[a].z),
          new THREE.Vector3(objectDefs[b].x, objectDefs[b].y, objectDefs[b].z),
        ]);
        scene.add(new THREE.Line(lineGeo, lineMat));
      }
    });

    // ── Animation loop ──────────────────────────────────────────
    let time = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      time += 0.008;

      // Smooth mouse
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      // Normalised scroll progress 0..1
      const scrollPct = Math.min(scrollRef.current / (scrollMaxRef.current || 5000), 1);

      objects.forEach((obj) => {
        obj.mesh.rotation.x += obj.rotationSpeed.x;
        obj.mesh.rotation.y += obj.rotationSpeed.y;
        obj.mesh.rotation.z += obj.rotationSpeed.z;

        // Harmonic float
        obj.mesh.position.y =
          obj.originalY +
          Math.sin(time * obj.floatSpeed + obj.floatOffset) * obj.floatAmplitude;

        // Diagonal travel path on scroll: objects weave across diagonal trajectories as you scroll
        const diagonalWave = Math.sin(scrollPct * Math.PI * 3 + obj.floatOffset) * 6 * obj.parallaxFactor;
        const targetX = obj.originalX + diagonalWave + mouseRef.current.x * obj.parallaxFactor * 3.5;
        obj.mesh.position.x += (targetX - obj.mesh.position.x) * 0.015;

        // Scroll camera pan — camera moves down as user scrolls
        // Objects stay at their world Y; camera Y descends matching scroll
        // No per-object Y correction needed; camera does the work.

        // Subtle Z breathing on scroll for depth drama
        obj.mesh.position.z = obj.originalZ + Math.sin(time * 0.2 + obj.floatOffset) * 0.8;
      });

      // Camera follows scroll progress vertically
      const targetCameraY = -scrollPct * 88; // matches total column height
      camera.position.y += (targetCameraY - camera.position.y) * 0.06;

      // Camera subtle mouse look
      camera.rotation.x += (-mouseRef.current.y * 0.04 - camera.rotation.x) * 0.04;
      camera.rotation.y += (-mouseRef.current.x * 0.03 - camera.rotation.y) * 0.04;

      // Particles drift
      particles.rotation.y += 0.0004;
      particles.rotation.x += 0.00015;

      renderer.render(scene, camera);
    };

    let isTabVisible = !document.hidden;
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    animFrameRef.current = requestAnimationFrame(animate);

    // ── Event listeners ─────────────────────────────────────────
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouse);

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      scrollRef.current = target.scrollTop || 0;
      scrollMaxRef.current = target.scrollHeight - target.clientHeight || 1;
    };
    const scrollContainer = document.getElementById('landing-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // Init max
      scrollMaxRef.current = scrollContainer.scrollHeight - scrollContainer.clientHeight || 1;
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);
      objects.forEach(o => {
        o.mesh.geometry.dispose();
        if (Array.isArray(o.mesh.material)) {
          o.mesh.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          (o.mesh.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
    };
  }, [getColors, createMaterial, isDark]);

  // ── Theme hot-swap ───────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    const colors = getColors();
    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.color) mat.color.setHex(colors.primary);
        if ('emissive' in mat) mat.emissive?.setHex(colors.emissive);
        mat.needsUpdate = true;
      }
      if (child instanceof THREE.PointLight) {
        child.color.setHex(colors.primary);
      }
      if (child instanceof THREE.Points) {
        const mat = child.material as THREE.PointsMaterial;
        mat.color.setHex(colors.primary);
        mat.needsUpdate = true;
      }
    });
  }, [theme, getColors]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.88 }}
    />
  );
}
