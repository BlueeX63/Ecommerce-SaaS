"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  PerspectiveCamera,
} from "@react-three/drei";
import { ConceptShoeModel } from "./ConceptShoeModel";
import * as THREE from "three";
import { MotionValue } from "framer-motion";

interface ConceptSceneProps {
  scrollYProgress: MotionValue<number>;
}

export function ConceptScene({
  scrollYProgress,
}: ConceptSceneProps) {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none z-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 0, 8]}
          fov={45}
        />

        <ambientLight intensity={0.1} />

        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={3.0}
          castShadow
          shadow-mapSize={2048}
        />

        <spotLight
          position={[-10, -10, -10]}
          angle={0.3}
          penumbra={1}
          intensity={1.0}
          color="#d0d8ff"
        />

        <pointLight position={[0, 5, -10]} intensity={1.0} color="#ffffff" />

        <Suspense fallback={null}>
          <ConceptShoeModel scrollYProgress={scrollYProgress} />
        </Suspense>

        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={0.5}
          scale={20}
          blur={2.5}
          far={5}
          resolution={512}
        />

        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}
