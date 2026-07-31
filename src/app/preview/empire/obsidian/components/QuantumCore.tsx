"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MotionValue } from "framer-motion";
import { MeshTransmissionMaterial } from "@react-three/drei";

function easeInOutExpo(t: number): number {
  return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

export function QuantumCore({
  scrollYProgress,
  variant = "V1"
}: {
  scrollYProgress: MotionValue<number>;
  variant?: string;
}) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);

  const { viewport } = useThree();

  const colors = {
    V1: 0xffffff, // White/glass
    V2: 0xff0044, // Red energy
    V3: 0x00ffcc, // Cyan energy
  };

  const activeColor = colors[variant as keyof typeof colors] || colors.V1;

  // Track mouse for parallax
  const mouse = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!group.current || !outerRef.current || !innerRef.current || !ring1Ref.current || !ring2Ref.current) return;

    // Get scroll progress
    const raw = scrollYProgress.get();
    const tRaw = Math.max(0, Math.min(1, raw)); // 0 to 1
    const t = easeInOutExpo(tRaw); // Eased progress

    // Base continuous rotation
    const time = state.clock.elapsedTime;
    
    // As t approaches 1, the rotation speed goes crazy (the explosion)
    const speed = 1 + t * 10;
    
    innerRef.current.rotation.x -= delta * 0.5 * speed;
    innerRef.current.rotation.y += delta * 0.8 * speed;
    
    ring1Ref.current.rotation.z -= delta * 0.3 * speed;
    ring1Ref.current.rotation.x += delta * 0.2 * speed;
    
    ring2Ref.current.rotation.y += delta * 0.4 * speed;
    ring2Ref.current.rotation.z += delta * 0.1 * speed;

    outerRef.current.rotation.y += delta * 0.1 * speed;

    // The Explosion effect
    // We break the elements apart in Z space
    const explosionFactor = t * 15; // How far apart they fly

    outerRef.current.position.z = explosionFactor * 0.5;
    innerRef.current.position.z = -explosionFactor * 0.8;
    ring1Ref.current.position.z = explosionFactor * 1.2;
    ring2Ref.current.position.z = -explosionFactor * 1.5;
    
    // Scale up as they explode
    const baseScale = 1.5;
    const expandScale = baseScale + t * 2;
    group.current.scale.setScalar(expandScale);

    // Parallax effect based on mouse
    targetRotation.current.x = (mouse.current.y * Math.PI) * 0.1;
    targetRotation.current.y = (mouse.current.x * Math.PI) * 0.1;
    
    group.current.rotation.x += (targetRotation.current.x - group.current.rotation.x) * 0.1;
    group.current.rotation.y += (targetRotation.current.y - group.current.rotation.y) * 0.1;
    
    // Y Bobbing
    group.current.position.y = Math.sin(time * 2) * 0.2 * (1 - t);
  });

  return (
    <group ref={group} dispose={null}>
      {/* Refractive Outer Shell */}
      <mesh ref={outerRef} castShadow receiveShadow>
        <icosahedronGeometry args={[2, 2]} />
        <MeshTransmissionMaterial
          backside
          samples={16}
          thickness={0.5}
          chromaticAberration={2}
          anisotropy={0.5}
          distortion={1}
          distortionScale={0.8}
          temporalDistortion={0.2}
          iridescence={1}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[100, 400]}
          color={activeColor}
        />
      </mesh>

      {/* Inner Glowing Core */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={2}
          wireframe
        />
      </mesh>

      {/* Energy Ring 1 */}
      <mesh ref={ring1Ref} castShadow>
        <torusGeometry args={[2.8, 0.02, 16, 100]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={10}
        />
      </mesh>
      
      {/* Energy Ring 2 */}
      <mesh ref={ring2Ref} rotation={[Math.PI/2, 0, 0]} castShadow>
        <torusGeometry args={[3.2, 0.05, 16, 100]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={5}
          wireframe
        />
      </mesh>
    </group>
  );
}
