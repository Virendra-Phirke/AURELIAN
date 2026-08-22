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
      wireframe: dark ? 0xe5c37820 : 0xc4972a15,
      fog: dark ? 0x060606 : 0xfaf8f5,
    };
  }, [isDark]);

  const createMaterial = useCallback((type: 'wire' | 'glass' | 'metal', colors: ReturnType<typeof getColors>): THREE.Material => {
    const dark = isDark();
    if (type === 'wire') {
      return new THREE.MeshBasicMaterial({
        color: colors.primary,
        wireframe: true,
        transparent: true,
        opacity: dark ? 0.18 : 0.12,
      });
    }
    if (type === 'glass') {
      return new THREE.MeshPhysicalMaterial({
        color: colors.primary,
        transparent: true,
        opacity: dark ? 0.06 : 0.04,
        roughness: 0.05,
        metalness: 0.3,
        reflectivity: 0.9,
        side: THREE.DoubleSide,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: colors.primary,
      emissive: colors.emissive,
      emissiveIntensity: dark ? 0.4 : 0.1,
      metalness: 0.8,
      roughness: 0.25,
      transparent: true,
      opacity: dark ? 0.55 : 0.35,
    });
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.z = 30;

    // Lights
    const colors = getColors();
    const ambientLight = new THREE.AmbientLight(colors.primary, isDark() ? 0.3 : 0.15);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(colors.primary, isDark() ? 2 : 1, 60);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, isDark() ? 0.5 : 0.8, 40);
    pointLight2.position.set(-15, -10, 5);
    scene.add(pointLight2);

    // Floating objects
    const objects: FloatingObject[] = [];

    const geometries = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.IcosahedronGeometry(1.5, 0),
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.OctahedronGeometry(0.9, 0),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1.4, 0),
      new THREE.TetrahedronGeometry(1.2, 0),
      new THREE.TorusGeometry(0.9, 0.25, 8, 24),
      new THREE.TorusGeometry(1.3, 0.2, 6, 20),
      new THREE.TorusGeometry(0.7, 0.15, 8, 16),
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
    ];

    const materialTypes: Array<'wire' | 'glass' | 'metal'> = [
      'metal', 'wire', 'glass', 'metal', 'wire', 'glass',
      'metal', 'wire', 'metal', 'glass', 'wire', 'metal',
    ];

    const positions = [
      [-18, 8, -15], [16, 12, -20], [-22, -5, -10], [20, -8, -18],
      [-10, 15, -25], [14, -14, -12], [-25, 2, -20], [8, 18, -15],
      [22, 5, -22], [-16, -15, -18], [0, -18, -15], [25, 12, -15],
    ];

    geometries.forEach((geo, i) => {
      const mat = createMaterial(materialTypes[i], colors);
      const mesh = new THREE.Mesh(geo, mat);
      const [x, y, z] = positions[i] as [number, number, number];
      mesh.position.set(x, y, z);
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
        originalY: y,
        parallaxFactor: 0.3 + Math.random() * 0.7,
      });
    });

    objectsRef.current = objects;

    // Ambient particle field
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions3d = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions3d[i * 3] = (Math.random() - 0.5) * 80;
      positions3d[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions3d[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions3d, 3));
    const particleMat = new THREE.PointsMaterial({
      color: colors.primary,
      size: 0.06,
      transparent: true,
      opacity: isDark() ? 0.5 : 0.3,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animation loop
    let time = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      time += 0.008;

      // Smooth mouse dampen
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      objects.forEach((obj) => {
        obj.mesh.rotation.x += obj.rotationSpeed.x;
        obj.mesh.rotation.y += obj.rotationSpeed.y;
        obj.mesh.rotation.z += obj.rotationSpeed.z;

        // Harmonic float
        obj.mesh.position.y =
          obj.originalY +
          Math.sin(time * obj.floatSpeed + obj.floatOffset) * obj.floatAmplitude;

        // Mouse parallax
        obj.mesh.position.x +=
          (mouseRef.current.x * obj.parallaxFactor * 3 -
            obj.mesh.position.x +
            positions[objectsRef.current.indexOf(obj)][0]) *
          0.01;

        // Scroll depth push
        const scrollFactor = scrollRef.current * 0.01;
        obj.mesh.position.z =
          positions[objectsRef.current.indexOf(obj)][2] - scrollFactor * obj.parallaxFactor * 2;
      });

      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Mouse handler
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouse);

    // Scroll handler
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      scrollRef.current = target.scrollTop || 0;
    };
    const scrollContainer = document.getElementById('landing-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);
      objects.forEach(o => { o.mesh.geometry.dispose(); (o.mesh.material as THREE.Material).dispose(); });
      renderer.dispose();
    };
  }, [getColors, createMaterial, isDark]);

  // Update materials when theme changes
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const colors = getColors();
    const scene = sceneRef.current;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.color) mat.color.setHex(colors.primary);
        if ('emissive' in mat) (mat as THREE.MeshStandardMaterial).emissive.setHex(colors.emissive);
        mat.needsUpdate = true;
      }
      if (child instanceof THREE.PointLight) {
        child.color.setHex(colors.primary);
      }
    });
  }, [theme, getColors]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
