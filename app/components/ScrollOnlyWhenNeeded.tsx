"use client";

import { useRef, useEffect, type ReactNode } from "react";

/**
 * Contenedor que solo muestra scroll (y permite usarlo) cuando el contenido desborda.
 * Cuando no hay desborde, overflow-y: hidden para que la barra no se vea ni se pueda usar.
 */
export default function ScrollOnlyWhenNeeded({
  children,
  className = "",
  style,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style">) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const needsScroll = el.scrollHeight > el.clientHeight + 1;
      el.style.overflowY = needsScroll ? "auto" : "hidden";
    };

    update();
    requestAnimationFrame(update);
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ overflowY: "hidden", WebkitOverflowScrolling: "touch", ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
