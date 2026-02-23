"use client";

import { useState } from "react";
import Image from "next/image";

const LOGO_WRAPPER_CLASS =
  "rounded-xl p-2 flex items-center justify-center min-h-[96px] relative";

function LogoTextFallback() {
  return (
    <div className="text-center w-full">
      <p
        className="text-base font-bold leading-tight sm:text-lg"
        style={{
          background: "linear-gradient(180deg, #ea580c 0%, #a21caf 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        SONORA
      </p>
      <p className="text-[10px] font-medium leading-tight text-amber-700 mt-0.5 sm:text-xs">
        TIERRA DE OPORTUNIDADES
      </p>
      <p className="text-[9px] leading-tight text-foreground/80 mt-1 sm:text-[10px]">
        Secretaría de Educación y Cultura
      </p>
    </div>
  );
}

export default function LogoSonoraSec({
  className = "",
  maxWidth = 200,
  priority = false,
}: {
  className?: string;
  maxWidth?: number;
  priority?: boolean;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`${LOGO_WRAPPER_CLASS} ${className}`}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      {imgError && <LogoTextFallback />}
      <Image
        src="/Logtipo_EscudoColor.png"
        alt="Sonora Tierra de Oportunidades · Secretaría de Educación y Cultura"
        width={Math.min(maxWidth, 480)}
        height={100}
        className={
          imgLoaded && !imgError
            ? "w-full h-auto object-contain opacity-100 transition-opacity duration-200"
            : "absolute inset-0 m-auto max-h-[96px] w-auto max-w-full object-contain opacity-0 transition-opacity duration-200"
        }
        style={{ maxWidth: "100%", maxHeight: "96px" }}
        priority={priority}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  );
}
