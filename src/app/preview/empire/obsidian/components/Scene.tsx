"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, SpotLight, Sparkles, Stars, Float } from "@react-three/drei";
import { QuantumCore } from "./QuantumCore";
import { MotionValue } from "framer-motion";
import * as THREE from "three";

// A component that controls the camera using scroll progress
function CameraController({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(({ camera }) => {
    const raw = scrollYProgress.get();
    const t = Math.max(0, Math.min(1, raw)); // 0 to 1

    // Smooth easing
    const ease = t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;

    // We start at Z=12 and fly deep into Z=-5 as we scroll
    const startZ = 12;
    const endZ = -5;

    camera.position.z = THREE.MathUtils.lerp(startZ, endZ, ease);

    // Add a slight barrel roll for cinematic effect
    camera.rotation.z = ease * Math.PI * 0.25;
  });

  return null;
}

export function Scene({
  scrollYProgress,
  variant
}: {
  scrollYProgress: MotionValue<number>;
  variant?: string;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 12], fov: 45 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.5
      }}
      className="w-full h-full pointer-events-none"
    >
      <CameraController scrollYProgress={scrollYProgress} />
      <Suspense fallback={null}>
        <color attach="background" args={['#020202']} />

        {/* Dynamic Background Particle System */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <Sparkles
            count={2000}
            scale={40}
            size={6}
            speed={0.8}
            color="#ffffff"
            opacity={0.5}
          />
        </Float>
        <Stars radius={50} depth={50} count={8000} factor={6} saturation={0} fade speed={2} />

        {/* High contrast dramatic lighting */}
        <ambientLight intensity={0.2} />

        {/* Main sharp spotlight for harsh highlights */}
        <SpotLight
          position={[10, 15, 10]}
          angle={0.2}
          penumbra={0.5}
          intensity={800}
          castShadow
          shadow-mapSize={[2048, 2048]}
          color="#ffffff"
        />

        {/* Rim light for edge definition against black background */}
        <SpotLight
          position={[-10, -5, -10]}
          angle={0.3}
          penumbra={1}
          intensity={400}
          color="#00ffff"
        />

        <QuantumCore
          scrollYProgress={scrollYProgress}
          variant={variant}
        />

        {/* Studio environment for reflections */}
        <Environment preset="city" />

      </Suspense>
    </Canvas>
  );
}
