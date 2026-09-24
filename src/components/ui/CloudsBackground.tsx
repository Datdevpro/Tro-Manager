"use client";

import React, { useEffect, useRef, useState } from "react";

interface CloudsBackgroundProps {
  children?: React.ReactNode;
  skyColor?: number;
  cloudColor?: number;
  lightColor?: number;
  backgroundColor?: number;
  speed?: number;
  className?: string;
}

export function CloudsBackground({
  children,
  skyColor = 0x5ca6ca,
  cloudColor = 0x334d80,
  lightColor = 0xffffff,
  backgroundColor = 0x000000,
  speed = 1.0,
  className = "",
}: CloudsBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let effectInstance: any = null;

    async function initVanta() {
      if (!containerRef.current || typeof window === "undefined") return;

      try {
        const THREE = await import("three");
        // Ensure THREE is globally available for Vanta plugins
        (window as any).THREE = THREE;

        // Dynamic import of Vanta Clouds2 effect
        // @ts-expect-error - vanta does not have TypeScript types
        const vantaClouds2Module = await import("vanta/dist/vanta.clouds2.min");
        const CLOUDS2 =
          vantaClouds2Module.default || (window as any).VANTA?.CLOUDS2;

        if (isMounted && containerRef.current && CLOUDS2) {
          effectInstance = CLOUDS2({
            el: containerRef.current,
            THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 2.0,
            skyColor,
            cloudColor,
            lightColor,
            backgroundColor,
            speed,
            texturePath: "/gallery/noise.png",
          });

          setVantaEffect(effectInstance);
        }
      } catch (err) {
        console.error("[Vanta Clouds2] Initialization error:", err);
      }
    }

    initVanta();

    return () => {
      isMounted = false;
      if (effectInstance) {
        effectInstance.destroy();
      }
    };
  }, [skyColor, cloudColor, lightColor, backgroundColor, speed]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-screen overflow-hidden ${className}`}
    >
      {/* Content overlay */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center">
        {children}
      </div>
    </div>
  );
}

export default CloudsBackground;
