"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  PerspectiveCamera,
} from "@react-three/drei";
import { ShoeModel } from "./ShoeModel";
import * as THREE from "three";
import { MotionValue } from "framer-motion";

interface SceneProps {
  scrollYProgress: MotionValue<number>;
  dockX?: number;
  dockY?: number;
}

export function Scene({
  scrollYProgress,
  dockX = 2.5,
  dockY = -0.3,
}: SceneProps) {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none z-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        {/* Static camera — no orbit, keeps things stable */}
        <PerspectiveCamera
          makeDefault
          position={[0, 0.3, 7]}
          fov={42}
        />

        {/* Cinematic 3-point lighting */}
        <ambientLight intensity={0.25} />

        {/* Key light */}
        <spotLight
          position={[8, 10, 8]}
          angle={0.2}
          penumbra={1}
          intensity={2.0}
          castShadow
          shadow-mapSize={2048}
        />

        {/* Fill light */}
        <spotLight
          position={[-8, 6, -4]}
          angle={0.4}
          penumbra={1}
          intensity={0.5}
          color="#d0d8ff"
        />

        {/* Rim/back light */}
        <pointLight position={[0, 8, -10]} intensity={0.5} />

        <Suspense fallback={null}>
          <ShoeModel
            scrollYProgress={scrollYProgress}
            dockX={dockX}
            dockY={dockY}
          />
        </Suspense>

        {/* Ground shadow */}
        <ContactShadows
          position={[0, -2.2, 0]}
          opacity={0.4}
          scale={16}
          blur={2}
          far={5}
          resolution={256}
        />

        {/* PBR reflections */}
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
