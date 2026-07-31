"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MotionValue } from "framer-motion";

const MODEL_PATH = "/models/shoe/Air Jordan 1 High Lost.glb";
useGLTF.preload(MODEL_PATH);

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function ShoeModel({
  scrollYProgress,
  dockX,
  dockY,
}: {
  scrollYProgress: MotionValue<number>;
  dockX: number;
  dockY: number;
}) {
  const group = useRef<THREE.Group>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const { scene } = useGLTF(MODEL_PATH) as any;

  // Pre-allocate to avoid GC at 60fps
  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _scaleVec = useMemo(() => new THREE.Vector3(), []);

  const { viewport, size } = useThree();

  // Accumulator for idle rotation
  const idleRotY = useRef(0);
  const initialScrollRotY = useRef<number | null>(null);

  // Traverse the scene once to collect all meshes for fast 60fps shadow toggling
  useEffect(() => {
    if (scene) {
      const meshes: THREE.Mesh[] = [];
      scene.traverse((child: any) => {
        if (child.isMesh) {
          meshes.push(child);
          child.receiveShadow = true;
          // Apply a slightly better material configuration if needed
          if (child.material) {
            child.material.envMapIntensity = 1.2;
          }
        }
      });
      meshesRef.current = meshes;
    }
  }, [scene]);

  useFrame((state, delta) => {
    if (!group.current) return;

    // ─── MATHEMATICALLY FLAWLESS DOCKING ───
    const isMobile = size.width < 768;
    let dynamicDockX = 0;
    let dynamicDockY = 0;

    if (isMobile) {
      dynamicDockX = 0;
      dynamicDockY = viewport.height * 0.2; // Slightly above center on mobile
    } else {
      const basePixelOffsetX = size.width >= 1100 ? 302.5 : size.width * 0.275;
      const finalPixelOffsetX = basePixelOffsetX - 7; // Move 7px left
      dynamicDockX = (finalPixelOffsetX / size.width) * viewport.width;
      dynamicDockY = (50 / size.height) * viewport.height;
    }

    const raw = scrollYProgress.get();
    const tRaw = Math.max(0, Math.min(1, (raw - 0.1) / 0.6));
    const t = easeInOutCubic(tRaw);
    const isDocked = raw >= 0.7;

    // ─── SCALE ───
    const heroScale = 18.0; 
    const dockedScale = 11.0;
    const scale = THREE.MathUtils.lerp(heroScale, dockedScale, t);
    _scaleVec.set(scale, scale, scale);
    group.current.scale.copy(_scaleVec);

    // ─── POSITION ───
    const x = THREE.MathUtils.lerp(0, dynamicDockX, t);
    const yOffset = THREE.MathUtils.lerp(0.8, 0, t);
    const y = THREE.MathUtils.lerp(0, dynamicDockY, t);
    
    const idle = 1 - t;
    const bobY = Math.sin(state.clock.elapsedTime * 1.5) * 0.1 * idle;
    
    _pos.set(x, y + bobY + yOffset, 0);
    group.current.position.copy(_pos);

    // ─── ROTATION ───
    const baseRotX = 0.2;
    const baseRotZ = 0;
    const dockRotX = 0.15;
    const dockRotY = -1.2;
    const dockRotZ = -0.05;

    if (t === 0) {
      idleRotY.current += delta * 0.3;
      group.current.rotation.set(baseRotX, idleRotY.current, baseRotZ);
      initialScrollRotY.current = idleRotY.current;
    } else {
      if (initialScrollRotY.current === null) {
        initialScrollRotY.current = idleRotY.current;
      }
      const rotX = THREE.MathUtils.lerp(baseRotX, dockRotX, t);
      const rotZ = THREE.MathUtils.lerp(baseRotZ, dockRotZ, t);
      
      const diff = initialScrollRotY.current - dockRotY;
      const extraRotations = Math.floor(diff / (Math.PI * 2));
      const targetRotY = dockRotY + (extraRotations * Math.PI * 2);
      
      const rotY = THREE.MathUtils.lerp(initialScrollRotY.current, targetRotY, t);
      group.current.rotation.set(rotX, rotY, rotZ);
    }
  });

  return (
    <group ref={group} dispose={null}>
      {scene && (
        <primitive object={scene} rotation={[0, Math.PI, 0]} />
      )}
    </group>
  );
}
