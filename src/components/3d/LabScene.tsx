import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Pre-allocated math objects to ensure zero GC in animation loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _mouseTarget = new THREE.Vector2(0, 0);
const _mouseCurrent = new THREE.Vector2(0, 0);

interface LabSceneProps {
  activeProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  className?: string;
}

export const LabScene: React.FC<LabSceneProps> = ({
  activeProjectId,
  onSelectProject,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webGlAvailable, setWebGlAvailable] = useState(true);
  const [isSoftware, setIsSoftware] = useState(false);
  const [currentCameraPreset, setCurrentCameraPreset] = useState<'core' | 'filebatch' | 'mekit' | 'sayhola'>('core');
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  // References to communicate with Three.js tick loop without re-triggering useEffect
  const sceneStateRef = useRef({
    activeProjectId,
    targetCameraPos: new THREE.Vector3(0, 0, 7.5),
    targetLookAt: new THREE.Vector3(0, 0, 0),
    isReducedMotion: false,
    hoveredMeshName: null as string | null,
  });

  useEffect(() => {
    sceneStateRef.current.activeProjectId = activeProjectId;
  }, [activeProjectId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    sceneStateRef.current.isReducedMotion = motionQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      sceneStateRef.current.isReducedMotion = e.matches;
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Detect WebGL & Software GL capability
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!gl) {
      setWebGlAvailable(false);
      setIsLoaded(true);
      return;
    }

    let isSoftwareGl = false;
    try {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      isSoftwareGl = false;
    }
    setIsSoftware(isSoftwareGl);

    // 1. Scene, Camera, Renderer Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090d, 0.045);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setClearColor(0x07090d, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment Lighting (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Balanced Studio Rig
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x4d8dff, 0x07090d, 1.2);
    scene.add(hemiLight);

    const cyanRimLight = new THREE.PointLight(0x55f2e3, 2.5, 15);
    cyanRimLight.position.set(-5, -2, -3);
    scene.add(cyanRimLight);

    const blueAccentLight = new THREE.PointLight(0x4d8dff, 3.0, 18);
    blueAccentLight.position.set(5, 3, 2);
    scene.add(blueAccentLight);

    // 4. Contact Shadow Plane Grounding
    const shadowGeo = new THREE.PlaneGeometry(12, 12);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(64, 64, 5, 64, 64, 60);
    grad.addColorStop(0, 'rgba(77, 141, 255, 0.35)');
    grad.addColorStop(0.4, 'rgba(13, 17, 24, 0.4)');
    grad.addColorStop(1, 'rgba(7, 9, 13, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.6;
    scene.add(shadowPlane);

    // 5. Central Procedural Core (Representing MK Labs Brand)
    // Assembled as a composite 8-part procedural group
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0, 0);

    // Part 1: Central Polyhedral Energy Core
    const innerGeo = new THREE.IcosahedronGeometry(1.0, 1);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x111e38,
      emissive: 0x4d8dff,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerCore);

    // Part 2: Inner Wireframe Lattice
    const wireGeo = new THREE.IcosahedronGeometry(1.04, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x55f2e3,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    // Part 3 & 4: Angled Modular Geometric Brackets (Echoing MK Logo geometry)
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0xf5f7fa,
      metalness: 0.85,
      roughness: 0.2,
    });
    const bracketDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e2638,
      metalness: 0.9,
      roughness: 0.3,
    });

    const bracketGeoA = new THREE.BoxGeometry(0.24, 2.3, 0.24);
    const bracketA1 = new THREE.Mesh(bracketGeoA, bracketMat);
    bracketA1.position.set(-1.15, 0, 0);
    coreGroup.add(bracketA1);

    const bracketA2 = new THREE.Mesh(bracketGeoA, bracketDarkMat);
    bracketA2.position.set(1.15, 0, 0);
    coreGroup.add(bracketA2);

    // Part 5: Interlocking Diagonal Chevron Bars
    const chevronGeo = new THREE.BoxGeometry(0.2, 1.6, 0.2);
    const chevron1 = new THREE.Mesh(chevronGeo, bracketMat);
    chevron1.position.set(-0.45, 0.3, 0.2);
    chevron1.rotation.z = Math.PI / 4;
    coreGroup.add(chevron1);

    const chevron2 = new THREE.Mesh(chevronGeo, bracketMat);
    chevron2.position.set(0.45, -0.3, 0.2);
    chevron2.rotation.z = -Math.PI / 4;
    coreGroup.add(chevron2);

    // Part 6 & 7: Dual Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(1.75, 0.02, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x4d8dff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x4d8dff,
      emissiveIntensity: 0.25,
    });
    const orbitalRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    orbitalRing1.rotation.x = Math.PI / 3;
    coreGroup.add(orbitalRing1);

    const ringGeo2 = new THREE.TorusGeometry(2.1, 0.015, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x55f2e3,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x55f2e3,
      emissiveIntensity: 0.2,
    });
    const orbitalRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    orbitalRing2.rotation.y = Math.PI / 4;
    orbitalRing2.rotation.x = -Math.PI / 6;
    coreGroup.add(orbitalRing2);

    // Part 8: Suspended Glass Data Panels
    const glassGeo = new THREE.BoxGeometry(0.8, 1.4, 0.03);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x4d8dff,
      transmission: isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: isSoftwareGl ? 0.4 : 0.7,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      depthWrite: false,
    });
    const glassPanel1 = new THREE.Mesh(glassGeo, glassMat);
    glassPanel1.position.set(1.4, 0.8, -0.6);
    glassPanel1.rotation.y = -0.4;
    coreGroup.add(glassPanel1);

    const glassPanel2 = new THREE.Mesh(glassGeo, glassMat);
    glassPanel2.position.set(-1.4, -0.7, 0.5);
    glassPanel2.rotation.y = 0.5;
    coreGroup.add(glassPanel2);

    scene.add(coreGroup);

    // 6. Project Universe Interactive 3D Objects
    const interactiveObjects: THREE.Object3D[] = [];

    // Project A: FileBatch - Conversion Portal Object
    const fileBatchGroup = new THREE.Group();
    fileBatchGroup.name = 'filebatch';
    fileBatchGroup.position.set(-3.2, 1.2, -1.0);

    const portalRingGeo = new THREE.TorusGeometry(0.7, 0.04, 16, 64);
    const portalRingMat = new THREE.MeshStandardMaterial({
      color: 0x4d8dff,
      emissive: 0x4d8dff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });
    const portalRing = new THREE.Mesh(portalRingGeo, portalRingMat);
    fileBatchGroup.add(portalRing);

    // Stacked data cards
    for (let i = 0; i < 3; i++) {
      const cardGeo = new THREE.BoxGeometry(0.45, 0.6, 0.02);
      const cardMat = new THREE.MeshStandardMaterial({
        color: i === 1 ? 0x55f2e3 : 0xffffff,
        metalness: 0.5,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
      });
      const card = new THREE.Mesh(cardGeo, cardMat);
      card.position.set(-0.2 + i * 0.2, -0.1 + i * 0.1, -0.25 + i * 0.25);
      card.rotation.y = 0.25;
      fileBatchGroup.add(card);
    }
    scene.add(fileBatchGroup);
    interactiveObjects.push(fileBatchGroup);

    // Project B: Mekit.online - Image Matrix Object
    const mekitGroup = new THREE.Group();
    mekitGroup.name = 'mekit';
    mekitGroup.position.set(3.2, -1.0, -0.8);

    const frameOuterGeo = new THREE.BoxGeometry(1.1, 1.1, 0.08);
    const frameOuterMat = new THREE.MeshStandardMaterial({
      color: 0x55f2e3,
      emissive: 0x55f2e3,
      emissiveIntensity: 0.35,
      wireframe: true,
    });
    const frameOuter = new THREE.Mesh(frameOuterGeo, frameOuterMat);
    mekitGroup.add(frameOuter);

    const tileGeo = new THREE.PlaneGeometry(0.75, 0.75);
    const tileMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d1118,
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 1.0,
      side: THREE.DoubleSide,
    });
    const tileMesh = new THREE.Mesh(tileGeo, tileMat);
    mekitGroup.add(tileMesh);

    scene.add(mekitGroup);
    interactiveObjects.push(mekitGroup);

    // Project C: SayHola - Communication Signal Nodes
    const sayholaGroup = new THREE.Group();
    sayholaGroup.name = 'sayhola';
    sayholaGroup.position.set(0.2, -2.4, 0.5);

    const commOrbGeo = new THREE.SphereGeometry(0.5, 24, 24);
    const commOrbMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x6366f1,
      emissiveIntensity: 0.4,
      metalness: 0.7,
      roughness: 0.25,
      wireframe: true,
    });
    const commOrb = new THREE.Mesh(commOrbGeo, commOrbMat);
    sayholaGroup.add(commOrb);

    for (let i = 0; i < 4; i++) {
      const satGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const satMat = new THREE.MeshBasicMaterial({ color: 0x55f2e3 });
      const sat = new THREE.Mesh(satGeo, satMat);
      const angle = (i * Math.PI) / 2;
      sat.position.set(Math.cos(angle) * 0.85, Math.sin(angle) * 0.85, 0);
      sayholaGroup.add(sat);
    }
    scene.add(sayholaGroup);
    interactiveObjects.push(sayholaGroup);

    // 7. Ambient Particle Field (Glowing Data Dust)
    const particleCount = isSoftwareGl ? 60 : 220;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorBlue = new THREE.Color(0x4d8dff);
    const colorCyan = new THREE.Color(0x55f2e3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 16;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 10 - 2;

      const chosenColor = Math.random() > 0.4 ? colorBlue : colorCyan;
      particleColors[i3] = chosenColor.r;
      particleColors[i3 + 1] = chosenColor.g;
      particleColors[i3 + 2] = chosenColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particleField = new THREE.Points(particleGeo, particleMat);
    scene.add(particleField);

    // 8. Raycaster for Interactive Hover & Click Selection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-999, -999);

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _mouseTarget.set(x, y);
      pointer.set(x, y);
    };

    const handleClick = () => {
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);
      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && !parent.name && parent.parent) {
          parent = parent.parent;
        }
        if (parent && parent.name && onSelectProject) {
          onSelectProject(parent.name);
        }
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    container.addEventListener('click', handleClick);

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop with Exponential Damping & Zero GC
    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;

    // Software GL pacing function per Three.js skill
    function afterDraw(cb: () => void) {
      const context = renderer.getContext() as WebGL2RenderingContext;
      const sync = context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE, 0);
      context.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && context.getSyncParameter(sync, context.SYNC_STATUS);
        if (state === context.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) context.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const animate = () => {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const isReduced = sceneStateRef.current.isReducedMotion;

      // Mouse tracking interpolation
      _mouseCurrent.x = THREE.MathUtils.damp(_mouseCurrent.x, _mouseTarget.x, 3.5, delta);
      _mouseCurrent.y = THREE.MathUtils.damp(_mouseCurrent.y, _mouseTarget.y, 3.5, delta);

      // Determine Target Camera Position based on active project
      const active = sceneStateRef.current.activeProjectId;
      if (active === 'filebatch') {
        sceneStateRef.current.targetCameraPos.set(-2.4, 1.2, 3.8);
        sceneStateRef.current.targetLookAt.set(-3.2, 1.2, -1.0);
      } else if (active === 'mekit') {
        sceneStateRef.current.targetCameraPos.set(2.4, -0.8, 3.8);
        sceneStateRef.current.targetLookAt.set(3.2, -1.0, -0.8);
      } else if (active === 'sayhola') {
        sceneStateRef.current.targetCameraPos.set(0.2, -1.6, 4.0);
        sceneStateRef.current.targetLookAt.set(0.2, -2.4, 0.5);
      } else {
        // Core View (Default)
        sceneStateRef.current.targetCameraPos.set(0, 0, 7.5);
        sceneStateRef.current.targetLookAt.set(0, 0, 0);
      }

      // Smooth camera motion
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        sceneStateRef.current.targetCameraPos.x + (isReduced ? 0 : _mouseCurrent.x * 0.4),
        2.5,
        delta
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        sceneStateRef.current.targetCameraPos.y + (isReduced ? 0 : _mouseCurrent.y * 0.3),
        2.5,
        delta
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        sceneStateRef.current.targetCameraPos.z,
        2.5,
        delta
      );

      _vec3A.set(
        THREE.MathUtils.damp(_vec3A.x, sceneStateRef.current.targetLookAt.x, 3.0, delta),
        THREE.MathUtils.damp(_vec3A.y, sceneStateRef.current.targetLookAt.y, 3.0, delta),
        THREE.MathUtils.damp(_vec3A.z, sceneStateRef.current.targetLookAt.z, 3.0, delta)
      );
      camera.lookAt(_vec3A);

      if (!isReduced) {
        // Central Core ambient rotation & mouse response
        coreGroup.rotation.y = elapsed * 0.25 + _mouseCurrent.x * 0.35;
        coreGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.08 - _mouseCurrent.y * 0.25;

        // Orbital rings independent velocity
        orbitalRing1.rotation.z = elapsed * 0.4;
        orbitalRing2.rotation.z = -elapsed * 0.3;

        // Inner core pulsation & breathing
        const pulse = 1 + Math.sin(elapsed * 1.5) * 0.03;
        innerCore.scale.set(pulse, pulse, pulse);
        wireMesh.scale.set(pulse, pulse, pulse);

        // Project nodes gentle hover oscillation
        fileBatchGroup.position.y = 1.2 + Math.sin(elapsed * 1.2) * 0.12;
        fileBatchGroup.rotation.y = elapsed * 0.3;

        mekitGroup.position.y = -1.0 + Math.cos(elapsed * 1.4) * 0.12;
        mekitGroup.rotation.y = -elapsed * 0.25;

        sayholaGroup.position.y = -2.4 + Math.sin(elapsed * 1.1 + 1.0) * 0.1;
        sayholaGroup.rotation.y = elapsed * 0.35;

        // Particle field subtle drift
        particleField.rotation.y = elapsed * 0.03;
      }

      // Check hover on interactive objects
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);
      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && !parent.name && parent.parent) {
          parent = parent.parent;
        }
        if (parent && parent.name) {
          document.body.style.cursor = 'pointer';
        }
      } else {
        document.body.style.cursor = 'auto';
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };

    setIsLoaded(true);

    if (isSoftwareGl) {
      afterDraw(animate);
    } else {
      frameId = requestAnimationFrame(animate);
    }

    // Cleanup resources
    return () => {
      isDisposed = true;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);
      motionQuery.removeEventListener('change', handleMotionChange);

      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }

      // Dispose geometries & materials
      innerGeo.dispose();
      innerMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      bracketGeoA.dispose();
      bracketMat.dispose();
      bracketDarkMat.dispose();
      chevronGeo.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      portalRingGeo.dispose();
      portalRingMat.dispose();
      frameOuterGeo.dispose();
      frameOuterMat.dispose();
      tileGeo.dispose();
      tileMat.dispose();
      commOrbGeo.dispose();
      commOrbMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      document.body.style.cursor = 'auto';
    };
  }, []);

  // Preset camera selection handler for dock
  const handlePresetSelect = (preset: 'core' | 'filebatch' | 'mekit' | 'sayhola') => {
    setCurrentCameraPreset(preset);
    if (preset === 'core') {
      if (onSelectProject) onSelectProject('');
    } else {
      if (onSelectProject) onSelectProject(preset);
    }
  };

  return (
    <div className={`relative w-full h-full select-none overflow-hidden ${className}`}>
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

      {/* WebGL Fallback Notification if GPU/WebGL completely unavailable */}
      {!webGlAvailable && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#07090D] p-6 text-center">
          <div className="max-w-md p-6 rounded-xl border border-[#1E2638] bg-[#0D1118]">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-[#4D8DFF]/10 text-[#4D8DFF] flex items-center justify-center font-mono font-bold">
              MK
            </div>
            <h3 className="text-lg font-semibold text-[#F5F7FA]">Interactive Laboratory</h3>
            <p className="mt-2 text-sm text-[#9AA6B5]">
              Hardware 3D acceleration is currently inactive. You can explore all studio products,
              specifications, and experiments smoothly in standard viewing mode.
            </p>
          </div>
        </div>
      )}

      {/* Initializing indicator */}
      {!isLoaded && webGlAvailable && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#07090D] transition-opacity duration-500">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#4D8DFF] border-t-transparent animate-spin" />
            <span className="font-mono text-xs text-[#9AA6B5] tracking-widest uppercase">
              Initializing Studio Core...
            </span>
          </div>
        </div>
      )}

      {/* Software Rendering Notice (Quiet indicator per threejs skill) */}
      {isSoftware && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <span className="font-mono text-[10px] text-[#9AA6B5]/70 bg-[#0D1118]/80 px-2 py-1 rounded border border-[#1E2638]">
            3D Engine: Standard Compatibility Mode
          </span>
        </div>
      )}

      {/* Collapsible Bottom Control Dock (Strictly adhering to Three.js skill ergonomics: zero center occlusion, collapsible zen mode, static indicators) */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-20 transition-transform duration-300 pointer-events-auto flex flex-col items-center ${
          controlsCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
        style={{ maxWidth: 'min(940px, 94vw)' }}
      >
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setControlsCollapsed(!controlsCollapsed)}
          className="mb-1.5 px-3 py-1 rounded-t-md bg-[#0D1118] border border-b-0 border-[#1E2638] text-[11px] font-mono text-[#9AA6B5] hover:text-[#F5F7FA] transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
          aria-label={controlsCollapsed ? 'Show 3D Viewport Controls' : 'Hide 3D Viewport Controls'}
        >
          <span>{controlsCollapsed ? '▲' : '▼'}</span>
          <span>{controlsCollapsed ? 'Show 3D Controls' : 'Zen Viewport Mode'}</span>
        </button>

        {/* Unified Bottom Control Dock */}
        <div className="w-full bg-[#0D1118] border border-[#1E2638] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#9AA6B5] uppercase tracking-wider hidden sm:inline">
              Spatial Lens:
            </span>
            <div className="flex items-center gap-1 bg-[#07090D] p-1 rounded-lg border border-[#1E2638]">
              <button
                onClick={() => handlePresetSelect('core')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  currentCameraPreset === 'core' && !activeProjectId
                    ? 'bg-[#4D8DFF] text-white shadow-sm'
                    : 'text-[#9AA6B5] hover:text-[#F5F7FA]'
                }`}
              >
                Studio Core
              </button>
              <button
                onClick={() => handlePresetSelect('filebatch')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  currentCameraPreset === 'filebatch' || activeProjectId === 'filebatch'
                    ? 'bg-[#4D8DFF] text-white shadow-sm'
                    : 'text-[#9AA6B5] hover:text-[#F5F7FA]'
                }`}
              >
                FileBatch
              </button>
              <button
                onClick={() => handlePresetSelect('mekit')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  currentCameraPreset === 'mekit' || activeProjectId === 'mekit'
                    ? 'bg-[#4D8DFF] text-white shadow-sm'
                    : 'text-[#9AA6B5] hover:text-[#F5F7FA]'
                }`}
              >
                Mekit.online
              </button>
              <button
                onClick={() => handlePresetSelect('sayhola')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  currentCameraPreset === 'sayhola' || activeProjectId === 'sayhola'
                    ? 'bg-[#4D8DFF] text-white shadow-sm'
                    : 'text-[#9AA6B5] hover:text-[#F5F7FA]'
                }`}
              >
                SayHola
              </button>
            </div>
          </div>

          {/* Static Spec Swatch & Reduced-Motion state */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#9AA6B5]">
            <span className="hidden md:inline">Drag or hover to rotate</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#55F2E3]" />
            <span className="text-[#F5F7FA]">Interactive WebGL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
