import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme';

interface FloatingObject {
  mesh: THREE.Mesh;
  rotationSpeed: THREE.Vector3;
  floatOffset: number;
  floatSpeed: number;
  floatAmplitude: number;
  originalY: number;
  originalX: number;
  originalZ: number;
  parallaxFactor: number;
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
      primary: dark ? 0xe5c378 : 0xc4972a,
      secondary: dark ? 0xffffff : 0x1a1612,
      emissive: dark ? 0x3d3010 : 0x8a6a00,
    };
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer with performance optimizations
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: window.devicePixelRatio <= 1,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.z = 26;

    const colors = getColors();
    const ambientLight = new THREE.AmbientLight(colors.primary, isDark() ? 0.4 : 0.25);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(colors.primary, isDark() ? 2.5 : 1.5, 70);
    pointLight1.position.set(15, 15, 15);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, isDark() ? 0.7 : 1.0, 50);
    pointLight2.position.set(-20, -15, 8);
    scene.add(pointLight2);

    // Shared Geometries to avoid redundant allocations
    const sharedGeos = {
      icosahedron: new THREE.IcosahedronGeometry(1.4, 0),
      octahedron: new THREE.OctahedronGeometry(1.3, 0),
      dodecahedron: new THREE.DodecahedronGeometry(1.2, 0),
      tetrahedron: new THREE.TetrahedronGeometry(1.4, 0),
      torus: new THREE.TorusGeometry(1.2, 0.3, 8, 24),
      box: new THREE.BoxGeometry(1.3, 1.3, 1.3),
    };

    // Shared Materials
    const dark = isDark();
    const materials = {
      wire: new THREE.MeshBasicMaterial({
        color: colors.primary,
        wireframe: true,
        transparent: true,
        opacity: dark ? 0.2 : 0.12,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: colors.primary,
        transparent: true,
        opacity: dark ? 0.08 : 0.05,
        roughness: 0.1,
        metalness: 0.3,
        side: THREE.DoubleSide,
      }),
      metal: new THREE.MeshStandardMaterial({
        color: colors.primary,
        emissive: colors.emissive,
        emissiveIntensity: dark ? 0.45 : 0.15,
        metalness: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity: dark ? 0.6 : 0.35,
      }),
      neon: new THREE.MeshStandardMaterial({
        color: colors.primary,
        emissive: colors.primary,
        emissiveIntensity: dark ? 0.7 : 0.25,
        metalness: 0.8,
        roughness: 0.15,
        transparent: true,
        opacity: dark ? 0.35 : 0.2,
      }),
    };

    const objects: FloatingObject[] = [];

    // Streamlined set of objects along the side rails
    const objectConfigs: Array<{
      geo: THREE.BufferGeometry;
      mat: THREE.Material;
      x: number; y: number; z: number;
      scale?: number;
    }> = [
      // Left Rail
      { geo: sharedGeos.icosahedron, mat: materials.metal, x: -28, y: 10, z: -8, scale: 1.6 },
      { geo: sharedGeos.torus, mat: materials.wire, x: -32, y: 3, z: -6, scale: 1.5 },
      { geo: sharedGeos.octahedron, mat: materials.neon, x: -26, y: -4, z: -10, scale: 1.4 },
      { geo: sharedGeos.tetrahedron, mat: materials.metal, x: -28, y: -16, z: -7, scale: 1.8 },
      { geo: sharedGeos.box, mat: materials.wire, x: -26, y: -28, z: -6, scale: 1.5 },
      { geo: sharedGeos.icosahedron, mat: materials.metal, x: -32, y: -44, z: -7, scale: 1.6 },
      { geo: sharedGeos.torus, mat: materials.wire, x: -26, y: -52, z: -11, scale: 1.5 },
      { geo: sharedGeos.octahedron, mat: materials.glass, x: -30, y: -64, z: -8, scale: 1.8 },
      { geo: sharedGeos.dodecahedron, mat: materials.neon, x: -28, y: -76, z: -8, scale: 1.6 },

      // Right Rail
      { geo: sharedGeos.dodecahedron, mat: materials.neon, x: 28, y: 10, z: -9, scale: 1.6 },
      { geo: sharedGeos.torus, mat: materials.metal, x: 26, y: -2, z: -8, scale: 1.5 },
      { geo: sharedGeos.octahedron, mat: materials.glass, x: 30, y: -10, z: -11, scale: 1.4 },
      { geo: sharedGeos.icosahedron, mat: materials.wire, x: 32, y: -22, z: -6, scale: 1.5 },
      { geo: sharedGeos.dodecahedron, mat: materials.neon, x: 26, y: -30, z: -10, scale: 1.8 },
      { geo: sharedGeos.tetrahedron, mat: materials.wire, x: 28, y: -40, z: -8, scale: 1.7 },
      { geo: sharedGeos.torus, mat: materials.metal, x: 30, y: -54, z: -9, scale: 1.5 },
      { geo: sharedGeos.dodecahedron, mat: materials.wire, x: 28, y: -64, z: -9, scale: 1.7 },
      { geo: sharedGeos.tetrahedron, mat: materials.metal, x: 26, y: -76, z: -8, scale: 1.6 },
    ];

    objectConfigs.forEach((cfg) => {
      const mesh = new THREE.Mesh(cfg.geo, cfg.mat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      if (cfg.scale) mesh.scale.setScalar(cfg.scale);
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      scene.add(mesh);

      objects.push({
        mesh,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.002
        ),
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.3 + Math.random() * 0.4,
        floatAmplitude: 0.5 + Math.random() * 0.8,
        originalY: cfg.y,
        originalX: cfg.x,
        originalZ: cfg.z,
        parallaxFactor: 0.3 + Math.random() * 0.7,
      });
    });

    objectsRef.current = objects;

    // Ambient particle field
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 90;
      pPositions[i * 3 + 1] = Math.random() * -90;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: colors.primary,
      size: 0.08,
      transparent: true,
      opacity: dark ? 0.5 : 0.3,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animation Loop
    let time = 0;
    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;
      animFrameRef.current = requestAnimationFrame(animate);
      time += 0.008;

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      const scrollPct = Math.min(scrollRef.current / (scrollMaxRef.current || 5000), 1);

      objects.forEach((obj) => {
        obj.mesh.rotation.x += obj.rotationSpeed.x;
        obj.mesh.rotation.y += obj.rotationSpeed.y;
        obj.mesh.rotation.z += obj.rotationSpeed.z;

        obj.mesh.position.y =
          obj.originalY +
          Math.sin(time * obj.floatSpeed + obj.floatOffset) * obj.floatAmplitude;

        const diagonalWave = Math.sin(scrollPct * Math.PI * 3 + obj.floatOffset) * 5 * obj.parallaxFactor;
        const targetX = obj.originalX + diagonalWave + mouseRef.current.x * obj.parallaxFactor * 3;
        obj.mesh.position.x += (targetX - obj.mesh.position.x) * 0.02;
      });

      const targetCameraY = -scrollPct * 88;
      camera.position.y += (targetCameraY - camera.position.y) * 0.06;
      camera.rotation.x += (-mouseRef.current.y * 0.03 - camera.rotation.x) * 0.04;
      camera.rotation.y += (-mouseRef.current.x * 0.03 - camera.rotation.y) * 0.04;

      particles.rotation.y += 0.0003;

      renderer.render(scene, camera);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animFrameRef.current);
      } else {
        if (!isRunning) {
          isRunning = true;
          animFrameRef.current = requestAnimationFrame(animate);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    animFrameRef.current = requestAnimationFrame(animate);

    // Resize
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
      scrollMaxRef.current = scrollContainer.scrollHeight - scrollContainer.clientHeight || 1;
    }

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);

      // Clean up shared resources
      Object.values(sharedGeos).forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [getColors, isDark]);

  // Theme hot-swap
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
      style={{ opacity: 0.85 }}
    />
  );
}

export default FloatingCanvas3D;

