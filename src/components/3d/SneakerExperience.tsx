"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, Float, PresentationControls } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function ShoeModel({ modelRef }: { modelRef: any }) {
  // Try to load shoe.glb. If not found, it will fail gracefully in the canvas error boundary if one exists.
  // For this demo, we assume the user places 'shoe.glb' in the /public folder.
  const { nodes, materials } = useGLTF("/shoe.glb") as any;

  // We rotate the model slightly to look good initially
  return (
    <group ref={modelRef} dispose={null}>
      {/* If shoe.glb is not present, we render a fallback 3D shape, but since useGLTF throws if missing, 
          we rely on the user having the file. As a fallback, you can comment this out and use a Box */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes?.shoe?.geometry || nodes?.Object_2?.geometry} // Adjust based on common gltf node names
        material={materials?.['Material.001'] || materials?.phong1 || new THREE.MeshStandardMaterial({ color: '#ff4400', roughness: 0.2, metalness: 0.8 })}
        scale={2.5}
      />
    </group>
  );
}

// Fallback geometric shoe if model isn't available
function FallbackShoe({ modelRef }: { modelRef: any }) {
  return (
    <group ref={modelRef}>
      <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[1, 0.5, 2.5]} />
        <meshStandardMaterial color="#f04438" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.5, -0.25]}>
        <boxGeometry args={[1.1, 1.5, 1.5]} />
        <meshStandardMaterial color="#111" roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Scene({ scrollProgress }: { scrollProgress: number }) {
  const modelRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!modelRef.current) return;

    // Scroll progress goes from 0 to 1
    // Initial hero: y = 0, rotY = 0
    // Mid transition: y = -2, rotY = Math.PI, scale shrinks
    // Final lock: y = -4.5 (matching the card position in DOM), rotY = Math.PI * 2, scale small

    // We animate position, rotation, and scale based on scrollProgress
    const targetY = gsap.utils.interpolate(0, -4.5, scrollProgress);
    const targetRotX = gsap.utils.interpolate(0, 0.2, scrollProgress);
    const targetRotY = gsap.utils.interpolate(0, Math.PI * 2.5, scrollProgress);
    const targetScale = gsap.utils.interpolate(1, 0.4, scrollProgress);

    // Smoothly interpolate current values to target values
    modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, targetY, 0.1);
    modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, targetRotX, 0.1);
    modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, targetRotY, 0.1);
    modelRef.current.scale.setScalar(THREE.MathUtils.lerp(modelRef.current.scale.x, targetScale, 0.1));
    
    // Camera dynamic movement
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, gsap.utils.interpolate(5, 8, scrollProgress), 0.1);
  });

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <FallbackShoe modelRef={modelRef} />
        {/* Replace FallbackShoe with <ShoeModel modelRef={modelRef} /> once you have the shoe.glb */}
      </Float>

      <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
    </>
  );
}

export default function SneakerExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !cardRef.current) return;

    // Setup GSAP ScrollTrigger to track progress through the page
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1, // Smooth scrubbing
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        }
      }
    });

    // Fade in product details when reaching the end
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 70%",
          end: "top 40%",
          scrub: true,
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] bg-[#fafafa]">
      {/* Fixed 3D Canvas Background */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
          <Scene scrollProgress={scrollProgress} />
        </Canvas>
      </div>

      {/* Foreground Content */}
      <div className="relative z-20 w-full h-full pointer-events-auto">
        
        {/* Hero Section */}
        <div className="h-screen flex items-center justify-center pt-20">
          <div className="text-center mix-blend-difference text-white">
            <h1 className="text-[12vw] font-black tracking-tighter leading-none uppercase">Air Max</h1>
            <p className="text-xl md:text-2xl font-light tracking-widest uppercase mt-4">The Future of Comfort</p>
          </div>
        </div>

        {/* Transition Section */}
        <div className="h-screen flex items-center justify-center">
          <p className="text-3xl md:text-5xl font-medium text-black/20 max-w-4xl text-center leading-tight">
            Engineered with precision. <br/> Built for gravity-defying performance.
          </p>
        </div>

        {/* Product Card Section */}
        <div className="h-screen flex flex-col justify-center pb-32">
          <div className="max-w-6xl mx-auto w-full px-6 flex justify-end">
            {/* 
              The shoe will land conceptually on the left side of this card due to 
              the hardcoded GSAP targetY and the Canvas overlay. 
            */}
            <div 
              ref={cardRef} 
              className="w-full md:w-1/2 bg-white/70 backdrop-blur-xl border border-white p-10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.05)]"
            >
              <div className="mb-2 text-sm font-bold tracking-widest text-[#F04438] uppercase">New Release</div>
              <h2 className="text-4xl font-black text-gray-900 mb-2 uppercase">Air Max Infinity</h2>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex text-yellow-400 text-sm">★★★★★</div>
                <span className="text-sm text-gray-500">(128 Reviews)</span>
              </div>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                Experience unparalleled comfort with our next-generation cushioning system. The responsive foam adapts to your stride, while the breathable engineered mesh keeps you cool all day long.
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Select Size</h4>
                  <div className="flex gap-3">
                    {['7', '8', '9', '10', '11'].map(size => (
                      <button key={size} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center font-medium text-gray-600 hover:border-black hover:text-black transition-colors focus:ring-2 focus:ring-black focus:outline-none">
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Color</h4>
                  <div className="flex gap-3">
                    <button className="w-8 h-8 rounded-full bg-[#f04438] ring-2 ring-offset-2 ring-[#f04438]"></button>
                    <button className="w-8 h-8 rounded-full bg-black"></button>
                    <button className="w-8 h-8 rounded-full bg-gray-200"></button>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <span className="text-4xl font-light text-gray-900">$180</span>
                <button className="px-8 py-4 bg-black text-white rounded-full font-bold uppercase tracking-wider hover:bg-[#F04438] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
