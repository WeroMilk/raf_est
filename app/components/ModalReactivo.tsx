"use client";

import { useEffect, useRef } from "react";
import type { ReactivoInfo } from "@/lib/reactivos-matematicas";

interface Props {
  reactivo: ReactivoInfo | null;
  onClose: () => void;
}

export default function ModalReactivo({ reactivo, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = reactivo ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [reactivo, onClose]);

  const handleBackdropClick = () => onClose();

  if (!reactivo) return null;

  const correcta = reactivo.opciones.find((o) => o.letra.toUpperCase() === reactivo.respuestaCorrecta);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reactivo-titulo"
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
    >
      {/* Backdrop - clic aquí cierra el modal */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in cursor-pointer"
        aria-hidden
        onClick={handleBackdropClick}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-h-[90vh] overflow-hidden rounded-t-2xl bg-[var(--card)] shadow-2xl animate-slide-up sm:max-w-lg sm:rounded-2xl sm:animate-scale-in"
      >
        {/* Header con gradiente guinda */}
        <div
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ background: "linear-gradient(135deg, #7B2D3E 0%, #9B3D4E 100%)" }}
        >
          <h2 id="modal-reactivo-titulo" className="text-lg font-semibold">
            Reactivo {reactivo.numero}
          </h2>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="touch-target -mr-2 flex h-10 w-10 min-w-[44px] min-h-[44px] items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 active:bg-white/30 cursor-pointer"
            aria-label="Cerrar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(90vh-4rem)] overflow-y-auto px-5 py-4">
          {/* Qué evalúa */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--fill-tertiary)] px-3 py-1.5">
            <span className="text-xs font-medium text-[var(--foreground)]/70">Evalúa:</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">{reactivo.evalua}</span>
          </div>

          {/* Pregunta */}
          <p className="mb-4 text-[15px] leading-relaxed text-[var(--foreground)]">
            {reactivo.pregunta}
          </p>

          {/* Opciones */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--foreground)]/70 uppercase tracking-wide">Opciones</p>
            {reactivo.opciones.map((op) => {
              const esCorrecta = op.letra.toUpperCase() === reactivo.respuestaCorrecta;
              return (
                <div
                  key={op.letra}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                    esCorrecta
                      ? "border-[var(--esperado)] bg-[var(--esperado)]/8"
                      : "border-[var(--border)] bg-[var(--fill-tertiary)]/50"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      esCorrecta ? "bg-[var(--esperado)] text-white" : "bg-[var(--foreground)]/10 text-[var(--foreground)]"
                    }`}
                  >
                    {op.letra.toUpperCase()}
                  </span>
                  <span className="text-sm leading-relaxed">{op.texto}</span>
                  {esCorrecta && (
                    <span className="ml-auto shrink-0 text-xs font-medium text-[var(--esperado)]">✓ Correcta</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Respuesta correcta destacada */}
          <div className="mt-4 rounded-xl border border-[var(--esperado)]/40 bg-[var(--esperado)]/6 px-4 py-3">
            <p className="text-xs font-medium text-[var(--foreground)]/70">Respuesta correcta</p>
            <p className="mt-0.5 font-semibold text-[var(--esperado)]">
              {reactivo.respuestaCorrecta}) {correcta?.texto}
            </p>
          </div>

          {/* Argumentación */}
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--fill-tertiary)]/30 px-4 py-3">
            <p className="text-xs font-medium text-[var(--foreground)]/70">Argumentación</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)] italic">
              {reactivo.argumentacion}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
