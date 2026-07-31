"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MotionValue } from "framer-motion";

const MODEL_PATH = "/models/shoe/Air Jordan 1 High Lost.glb";
useGLTF.preload(MODEL_PATH);

export function ConceptShoeModel({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH) as any;

  // Clone scene so we don't mutate the cached one used by the home page
  const solidScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // Clone the material so we don't affect the original cached gltf material
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0;
      }
    });
    return clone;
  }, [scene]);
  const wireframeScene = useMemo(() => {
    const clone = scene.clone();
    const wireMat = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.material = wireMat;
      }
    });
    return clone;
  }, [scene]);

  // Pre-allocate for performance
  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _scaleVec = useMemo(() => new THREE.Vector3(), []);
  const _rot = useMemo(() => new THREE.Euler(), []);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);

  // Accumulators
  const idleRotY = useRef(0);
  const baseDockRotY = useRef(Math.PI);

  useFrame((state, delta) => {
    if (!group.current) return;
    const raw = scrollYProgress.get(); // 0 to 1

    let targetScale = 15;
    let targetX = 0;
    let targetY = 0;
    let targetRotX = 0.2;
    let targetRotY = 0;
    let targetRotZ = 0;
    
    // Fade transition between wireframe and solid
    const transitionP = THREE.MathUtils.clamp((raw - 0.45) / 0.1, 0, 1);

    // We have 4 phases mapped over 0..1
    if (raw < 0.25) {
      // Phase 1: 0 - 0.25
      const p = raw / 0.25;
      targetScale = 18;
      targetY = Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      
      idleRotY.current += delta * 0.2;
      targetRotY = idleRotY.current;
      
      const dockRotY = Math.PI;
      const diff = idleRotY.current - dockRotY;
      const extraRotations = Math.floor(diff / (Math.PI * 2));
      baseDockRotY.current = dockRotY + (extraRotations * Math.PI * 2);
      
    } else if (raw < 0.5) {
      // Phase 2: 0.25 - 0.5
      const p = (raw - 0.25) / 0.25;
      // Ease in out
      const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      targetScale = THREE.MathUtils.lerp(18, 35, t);
      targetY = THREE.MathUtils.lerp(Math.sin(state.clock.elapsedTime * 1.5) * 0.2, -1, t);
      targetRotX = THREE.MathUtils.lerp(0.2, Math.PI / 2 - 0.2, t); // Show sole
      targetRotY = THREE.MathUtils.lerp(idleRotY.current, baseDockRotY.current, t);
    } else if (raw < 0.75) {
      // Phase 3: 0.5 - 0.75 (Materializes!)
      const p = (raw - 0.5) / 0.25;
      const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      targetScale = THREE.MathUtils.lerp(35, 18, t);
      targetY = THREE.MathUtils.lerp(-1, 0, t);
      targetRotX = THREE.MathUtils.lerp(Math.PI / 2 - 0.2, 0.1, t);
      targetRotY = THREE.MathUtils.lerp(baseDockRotY.current, baseDockRotY.current + Math.PI / 2, t);
    } else {
      // Phase 4: 0.75 - 1.0 (Floats away)
      const p = (raw - 0.75) / 0.25;
      const t = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      targetScale = THREE.MathUtils.lerp(18, 0, t);
      targetY = THREE.MathUtils.lerp(0, 10, t);
      targetRotX = THREE.MathUtils.lerp(0.1, -0.5, t);
      targetRotY = THREE.MathUtils.lerp(baseDockRotY.current + Math.PI / 2, baseDockRotY.current + Math.PI / 2 + Math.PI, t);
    }

    // Apply smoothly
    _scaleVec.setScalar(targetScale);
    group.current.scale.lerp(_scaleVec, 0.1);

    _pos.set(targetX, targetY, 0);
    group.current.position.lerp(_pos, 0.1);

    _rot.set(targetRotX, targetRotY, targetRotZ);
    targetQuat.setFromEuler(_rot);
    group.current.quaternion.slerp(targetQuat, 0.1);

    // Apply smooth opacity crossfade
    wireframeScene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material.opacity = (1 - transitionP) * 0.15;
      }
    });

    solidScene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material.opacity = transitionP;
      }
    });
  });

  return (
    <group ref={group}>
      <primitive object={wireframeScene} />
      <primitive object={solidScene} />
    </group>
  );
}
