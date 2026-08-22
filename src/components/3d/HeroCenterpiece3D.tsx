import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme';

export function HeroCenterpiece3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const autoRotation = useRef({ x: 0, y: 0 });
  const dragDelta = useRef({ x: 0, y: 0 });

  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.z = 12;

    const isDark = () => themeRef.current === 'dark' || themeRef.current === 'system';
    const gold = () => isDark() ? 0xe5c378 : 0xc4972a;
    const emissive = () => isDark() ? 0x3d3010 : 0x5a4000;
    const dimGold = () => isDark() ? 0xb89a50 : 0x9a7520;

    // Master group for drag rotation
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Core Crystal — faceted gem
    const coreGeo = new THREE.IcosahedronGeometry(1.1, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: gold(),
      emissive: emissive(),
      emissiveIntensity: isDark() ? 0.4 : 0.15,
      metalness: 0.9,
      roughness: 0.05,
      reflectivity: 1,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    masterGroup.add(coreMesh);

    // 2. Inner wireframe
    const innerWireMat = new THREE.MeshBasicMaterial({
      color: gold(),
      wireframe: true,
      transparent: true,
      opacity: isDark() ? 0.35 : 0.25,
    });
    const innerWireMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), innerWireMat);
    masterGroup.add(innerWireMesh);

    // 3. Gyroscope rings
    const rings: THREE.Mesh[] = [];
    const ringConfigs = [
      { radius: 2.2, tube: 0.04, rotX: Math.PI / 2, rotZ: 0, color: gold() },
      { radius: 2.8, tube: 0.04, rotX: Math.PI / 3, rotZ: Math.PI / 6, color: dimGold() },
      { radius: 3.4, tube: 0.04, rotX: Math.PI / 6, rotZ: Math.PI / 3, color: gold() },
      { radius: 2.5, tube: 0.035, rotX: 0, rotZ: Math.PI / 4, color: dimGold() },
    ];

    ringConfigs.forEach(({ radius, tube, rotX, rotZ, color }) => {
      const geo = new THREE.TorusGeometry(radius, tube, 12, 80);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: emissive(),
        emissiveIntensity: isDark() ? 0.5 : 0.2,
        metalness: 0.95,
        roughness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = rotX;
      mesh.rotation.z = rotZ;
      masterGroup.add(mesh);
      rings.push(mesh);
    });

    // 4. Orbiting gems
    const orbitGroup = new THREE.Group();
    masterGroup.add(orbitGroup);
    const gemPositions = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const orbitGems: THREE.Mesh[] = [];
    gemPositions.forEach((angle, i) => {
      const geo = new THREE.OctahedronGeometry(0.2, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? gold() : dimGold(),
        emissive: emissive(),
        emissiveIntensity: isDark() ? 0.6 : 0.2,
        metalness: 0.9,
        roughness: 0.1,
      });
      const gem = new THREE.Mesh(geo, mat);
      gem.position.set(Math.cos(angle) * 3.8, Math.sin(angle) * 0.5, Math.sin(angle) * 3.8);
      orbitGroup.add(gem);
      orbitGems.push(gem);
    });

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(gold(), isDark() ? 0.5 : 0.8);
    scene.add(ambientLight);

    const pointLightFront = new THREE.PointLight(gold(), isDark() ? 4 : 2, 30);
    pointLightFront.position.set(5, 5, 8);
    scene.add(pointLightFront);

    const pointLightBack = new THREE.PointLight(0xffffff, isDark() ? 1.5 : 1, 20);
    pointLightBack.position.set(-5, -3, -5);
    scene.add(pointLightBack);

    const rimLight = new THREE.PointLight(gold(), isDark() ? 2 : 1, 15);
    rimLight.position.set(0, 8, 2);
    scene.add(rimLight);

    // Animation
    let time = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      time += 0.008;

      // Auto orbit
      if (!isDragging.current) {
        masterGroup.rotation.y += 0.004;
        masterGroup.rotation.x += 0.001;
        dragDelta.current.x *= 0.95;
        dragDelta.current.y *= 0.95;
      } else {
        masterGroup.rotation.y += dragDelta.current.x * 0.01;
        masterGroup.rotation.x += dragDelta.current.y * 0.01;
      }

      // Rings counter-rotate for gyroscope effect
      rings.forEach((ring, i) => {
        ring.rotation.z += (i % 2 === 0 ? 0.005 : -0.007) * (i + 1) * 0.5;
      });

      // Core crystal pulse
      const pulse = 1 + Math.sin(time * 1.5) * 0.03;
      coreMesh.scale.setScalar(pulse);
      innerWireMesh.rotation.y += 0.006;
      innerWireMesh.rotation.z += 0.003;

      // Orbiting gems
      orbitGroup.rotation.y += 0.012;
      orbitGems.forEach((gem, i) => {
        gem.rotation.y += 0.02 * (i % 2 === 0 ? 1 : -1);
        gem.position.y = Math.sin(time * 1.2 + (i * Math.PI) / 2) * 0.6;
      });

      // Dynamic lighting
      pointLightFront.position.x = Math.sin(time * 0.7) * 6;
      pointLightFront.position.y = Math.cos(time * 0.5) * 4;

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // Mouse drag
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
      dragDelta.current = { x: 0, y: 0 };
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      dragDelta.current.x = e.clientX - prevMouse.current.x;
      dragDelta.current.y = e.clientY - prevMouse.current.y;
      masterGroup.rotation.y += dragDelta.current.x * 0.008;
      masterGroup.rotation.x += dragDelta.current.y * 0.008;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => { isDragging.current = false; };

    // Touch drag
    const handleTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - prevMouse.current.x;
      const dy = e.touches[0].clientY - prevMouse.current.y;
      masterGroup.rotation.y += dx * 0.008;
      masterGroup.rotation.x += dy * 0.008;
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchEnd = () => { isDragging.current = false; };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    renderer.domElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    />
  );
}
