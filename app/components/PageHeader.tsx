"use client";

import LogoSonoraSec from "@/app/components/LogoSonoraSec";

/**
 * Header compartido para todas las pantallas (excepto login).
 * El logo Sonora siempre aparece en la esquina superior derecha,
 * tanto en desktop como en móvil.
 */
export default function PageHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`shrink-0 flex flex-row flex-nowrap items-start justify-between gap-2 min-h-0 ${className}`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 self-start ml-auto">
        <LogoSonoraSec maxWidth={160} className="hidden sm:block" />
        <LogoSonoraSec maxWidth={130} className="sm:hidden" compact />
      </div>
    </header>
  );
}
