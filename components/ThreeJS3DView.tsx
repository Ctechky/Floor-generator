import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Dimension, BlockedArea, Layout, PlacedRoom } from '../roomtype';

const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.1;
const BLOCKED_AREA_HEIGHT = 3.5;

/**
 * Creates a text label as a sprite in the 3D scene.
 * This is a pure utility function and is defined outside the component.
 */
const createLabel = (text: string, position: THREE.Vector3, color: string, fontSize: number = 32) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    context.font = `Bold ${fontSize}px Arial`;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    canvas.width = textWidth;
    canvas.height = fontSize;
    
    context.font = `Bold ${fontSize}px Arial`;
    context.fillStyle = color;
    context.fillText(text, 0, fontSize * 0.85);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(aspect * 0.5, 0.5, 1.0);
    sprite.position.copy(position);
    return sprite;
};

interface ThreeJS3DViewProps {
  theme: 'light' | 'dark';
  floorAreaDimensions: Dimension;
  layout: Layout | undefined;
  blockedAreas: BlockedArea[];
}

const ThreeJS3DView: React.FC<ThreeJS3DViewProps> = ({
  theme,
  floorAreaDimensions,
  layout,
  blockedAreas,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const textures = useMemo(() => {
    // Wall Texture
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 128;
    wallCanvas.height = 128;
    const wallCtx = wallCanvas.getContext('2d')!;
    wallCtx.fillStyle = '#fdfdfd';
    wallCtx.fillRect(0, 0, 128, 128);
    wallCtx.strokeStyle = '#f0f0f0';
    wallCtx.lineWidth = 1;
    for (let i = 0; i < 128; i += 8) {
      wallCtx.beginPath();
      wallCtx.moveTo(i, 0);
      wallCtx.lineTo(i, 128);
      wallCtx.stroke();
    }
    const wallTexture = new THREE.CanvasTexture(wallCanvas);

    // Floor Texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 128;
    floorCanvas.height = 128;
    const floorCtx = floorCanvas.getContext('2d')!;
    floorCtx.fillStyle = '#a0522d'; // Sienna
    floorCtx.fillRect(0, 0, 128, 128);
    floorCtx.strokeStyle = '#8B4513'; // SaddleBrown
    floorCtx.lineWidth = 4;
    for (let i = 0; i < 128; i += 24) {
      floorCtx.beginPath();
      floorCtx.moveTo(0, i);
      floorCtx.lineTo(128, i);
      floorCtx.stroke();
    }
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;

    // Concrete Texture
    const concreteCanvas = document.createElement('canvas');
    concreteCanvas.width = 128;
    concreteCanvas.height = 128;
    const concreteCtx = concreteCanvas.getContext('2d')!;
    concreteCtx.fillStyle = '#808080';
    concreteCtx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const c = Math.floor(Math.random() * 30) + 110;
      concreteCtx.fillStyle = `rgb(${c},${c},${c})`;
      concreteCtx.fillRect(x, y, 1, 1);
    }
    const concreteTexture = new THREE.CanvasTexture(concreteCanvas);

    return { wallTexture, floorTexture, concreteTexture };
  }, []);


  // Effect for initial scene setup and teardown
  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(15, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
        if (!currentMount || !cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    });
    resizeObserver.observe(currentMount);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (currentMount && renderer.domElement) {
        try {
          currentMount.removeChild(renderer.domElement);
        } catch (e) {
          // Ignore error if element is already gone
        }
      }
      Object.values(textures).forEach(texture => texture.dispose());
      controls.dispose();
      renderer.dispose();
    };
  }, [textures]);


  // Effect for building and updating the scene contents
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;
    
    const style = getComputedStyle(document.documentElement);
    scene.background = new THREE.Color(style.getPropertyValue('--bg-secondary').trim());

    // --- Cleanup previous objects ---
    const objectsToRemove = scene.children.filter(child => child.userData.isFloorplanObject);
    objectsToRemove.forEach(child => {
      scene.remove(child);
      child.traverse((object: any) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((m: any) => { if (m.map) m.map.dispose(); m.dispose(); });
            } else if (object.material.map) {
              object.material.map.dispose();
              object.material.dispose();
            }
        }
      });
    });

    const { width: floorW, height: floorH } = floorAreaDimensions;
    
    // --- Camera and Controls Update ---
    camera.position.set(floorW / 2, Math.max(floorW, floorH) * 1.2, floorH * 1.2);
    controls.target.set(floorW / 2, 0, floorH / 2);

    /** Creates the base plane and axis helpers for the scene. */
    const createSceneBase = () => {
        const objects: THREE.Object3D[] = [];
        const planeGeometry = new THREE.PlaneGeometry(floorW, floorH);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: style.getPropertyValue('--canvas-bg').trim(), side: THREE.DoubleSide });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(floorW / 2, 0, floorH / 2);
        plane.receiveShadow = true;
        objects.push(plane);
        
        const axisLineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(style.getPropertyValue('--canvas-tick').trim()) });
        const labelColor = style.getPropertyValue('--text-secondary').trim();
        const tickInterval = Math.max(1, Math.round(Math.max(floorW, floorH) / 10));

        // X-axis and Z-axis lines
        objects.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(floorW, 0, 0)]), axisLineMaterial));
        objects.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, floorH)]), axisLineMaterial));
        
        // Axis ticks and labels
        for (let i = 0; i <= floorW; i += tickInterval) {
            objects.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, 0, 0), new THREE.Vector3(i, 0, -0.2)]), axisLineMaterial));
            const label = createLabel(i.toString(), new THREE.Vector3(i, 0, -0.6), labelColor);
            if (label) objects.push(label);
        }
        for (let i = tickInterval; i <= floorH; i += tickInterval) {
            objects.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.2, 0, i), new THREE.Vector3(0, 0, i)]), axisLineMaterial));
            const label = createLabel(i.toString(), new THREE.Vector3(-0.6, 0, i), labelColor);
            if (label) objects.push(label);
        }
        return objects;
    };

    /** Creates a 3D object group for a single room. */
    const createRoomObject = (item: PlacedRoom) => {
        const w = item.rotated ? item.dimensions.height : item.dimensions.width;
        const h = item.rotated ? item.dimensions.width : item.dimensions.height;
        if (w <= 0 || h <= 0) return null;

        const roomGroup = new THREE.Group();
        roomGroup.position.set(item.x, 0, item.y);
        
        const floorMap = textures.floorTexture.clone();
        floorMap.needsUpdate = true;
        floorMap.repeat.set(w / 2, h / 2);
        const floorMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshStandardMaterial({ map: floorMap, color: item.color, transparent: true, opacity: 0.8 })
        );
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.set(w / 2, 0.01, h / 2);
        floorMesh.receiveShadow = true;
        roomGroup.add(floorMesh);

        const wallMaterial = new THREE.MeshStandardMaterial({ 
          map: textures.wallTexture, 
          color: new THREE.Color(item.color).lerp(new THREE.Color(0xffffff), 0.5),
          transparent: true,
          opacity: 0.7
        });
        const walls = [
          new THREE.Mesh(new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, h), wallMaterial),
          new THREE.Mesh(new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, h), wallMaterial),
          new THREE.Mesh(new THREE.BoxGeometry(w, WALL_HEIGHT, WALL_THICKNESS), wallMaterial),
          new THREE.Mesh(new THREE.BoxGeometry(w, WALL_HEIGHT, WALL_THICKNESS), wallMaterial),
        ];
        walls[0].position.set(WALL_THICKNESS / 2, WALL_HEIGHT / 2, h / 2); // Left
        walls[1].position.set(w - WALL_THICKNESS / 2, WALL_HEIGHT / 2, h / 2); // Right
        walls[2].position.set(w / 2, WALL_HEIGHT / 2, WALL_THICKNESS / 2); // Back
        walls[3].position.set(w / 2, WALL_HEIGHT / 2, h - WALL_THICKNESS / 2); // Front
        walls.forEach(wall => { wall.castShadow = true; wall.receiveShadow = true; roomGroup.add(wall); });

        const borderPoints = [ new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(w, 0.02, 0), new THREE.Vector3(w, 0.02, h), new THREE.Vector3(0, 0.02, h), new THREE.Vector3(0, 0.02, 0) ];
        const borderLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(borderPoints),
            new THREE.LineBasicMaterial({ color: new THREE.Color(style.getPropertyValue('--canvas-room-stroke').trim()), linewidth: 2 })
        );
        roomGroup.add(borderLine);

        return roomGroup;
    };
    
    /** Creates a 3D object for a single blocked area. */
    const createBlockedAreaObject = (item: BlockedArea) => {
        const { width: w, height: h } = item;
        if (w <= 0 || h <= 0) return null;

        const concreteMaterial = new THREE.MeshStandardMaterial({ map: textures.concreteTexture, transparent: true, opacity: 0.8 });
        const geometry = new THREE.BoxGeometry(w, BLOCKED_AREA_HEIGHT, h);
        const cube = new THREE.Mesh(geometry, concreteMaterial);
        cube.position.set(item.x + w / 2, BLOCKED_AREA_HEIGHT / 2, item.y + h / 2);
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: style.getPropertyValue('--canvas-room-stroke').trim(), linewidth: 2 }));
        wireframe.position.copy(cube.position);
        
        return [cube, wireframe];
    };
    
    // --- Build Scene ---
    const allObjects: THREE.Object3D[] = createSceneBase();
    
    if (layout) {
        layout.placedRooms.forEach(item => {
            const roomObj = createRoomObject(item);
            if(roomObj) allObjects.push(roomObj);
        });
    }

    blockedAreas.forEach(item => {
        const blockedObjs = createBlockedAreaObject(item);
        if(blockedObjs) allObjects.push(...blockedObjs);
    });
    
    allObjects.forEach(obj => {
        obj.userData.isFloorplanObject = true;
        scene.add(obj);
    });


  }, [floorAreaDimensions, layout, blockedAreas, theme, textures]);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing"></div>;
};

export default ThreeJS3DView;