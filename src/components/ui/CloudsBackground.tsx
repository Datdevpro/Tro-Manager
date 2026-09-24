"use client";

import React, { useEffect, useRef, useState } from "react";

export interface CloudsBackgroundProps {
  children?: React.ReactNode;
  /** Màu nền cơ sở (Hex number, ví dụ: 0x0 hoặc 0xffffff) */
  backgroundColor?: number;
  /** Màu bầu trời (Hex number, ví dụ: 0x68b8d7 hoặc 0x5ca6ca) */
  skyColor?: number;
  /** Màu của các đám mây (Hex number, ví dụ: 0xadc1de hoặc 0x334d80) */
  cloudColor?: number;
  /** Màu vùng bóng tối của mây (Hex number, ví dụ: 0x183550) */
  cloudShadowColor?: number;
  /** Màu mặt trời (Hex number, ví dụ: 0xff9919) */
  sunColor?: number;
  /** Màu vầng hào quang mặt trời (Hex number, ví dụ: 0xff6633) */
  sunGlareColor?: number;
  /** Màu ánh nắng mặt trời (Hex number, ví dụ: 0xff9933) */
  sunlightColor?: number;
  /** Tốc độ di chuyển của mây (mặc định: 1.0) */
  speed?: number;
  /** Cho phép tương tác khi di chuột (mặc định: true) */
  mouseControls?: boolean;
  /** Cho phép tương tác trên màn cảm ứng (mặc định: true) */
  touchControls?: boolean;
  /** Tương tác con quay hồi chuyển trên mobile (mặc định: false) */
  gyroControls?: boolean;
  /** CSS class bổ sung cho container ngoài */
  className?: string;
}

export function CloudsBackground({
  children,
  backgroundColor = 0xffffff,
  skyColor = 0x68b8d7,
  cloudColor = 0xadc1de,
  cloudShadowColor = 0x183550,
  sunColor = 0xff9919,
  sunGlareColor = 0xff6633,
  sunlightColor = 0xff9933,
  speed = 1.0,
  mouseControls = true,
  touchControls = true,
  gyroControls = false,
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
        // Gắn THREE lên window để plugin Vanta truy cập
        (window as any).THREE = THREE;

        // Dynamic import hiệu ứng vanta.clouds.min.js
        // @ts-expect-error - vanta không có TypeScript types chính thức
        const vantaCloudsModule = await import("vanta/dist/vanta.clouds.min");
        const CLOUDS =
          vantaCloudsModule.default || (window as any).VANTA?.CLOUDS;

        if (isMounted && containerRef.current && CLOUDS) {
          effectInstance = CLOUDS({
            el: containerRef.current,
            THREE,
            mouseControls,
            touchControls,
            gyroControls,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 3.0,
            scaleMobile: 12.0,
            backgroundColor,
            skyColor,
            cloudColor,
            cloudShadowColor,
            sunColor,
            sunGlareColor,
            sunlightColor,
            speed,
          });

          setVantaEffect(effectInstance);
        }
      } catch (err) {
        console.error("[Vanta Clouds] Initialization error:", err);
      }
    }

    initVanta();

    return () => {
      isMounted = false;
      if (effectInstance) {
        effectInstance.destroy();
      }
    };
  }, [
    backgroundColor,
    skyColor,
    cloudColor,
    cloudShadowColor,
    sunColor,
    sunGlareColor,
    sunlightColor,
    speed,
    mouseControls,
    touchControls,
    gyroControls,
  ]);

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
