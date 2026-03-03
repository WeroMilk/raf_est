"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { AlumnoRAF } from "@/types/raf";
import { NIVEL_COLOR } from "@/types/raf";
import { getReactivoInfo } from "@/lib/reactivos-matematicas";

interface Props {
  alumno: AlumnoRAF | null;
  cct?: string;
  onClose: () => void;
}

const OPCIONES_VALIDAS = ["A", "B", "C", "D"] as const;

/** Detecta si los datos usan formato C/X (C=correcto, X=incorrecto) en lugar de A/B/C/D */
function usaFormatoCX(respuestas: string[]): boolean {
  return respuestas.every((r) => {
    const x = (r ?? "").toUpperCase().trim();
    return x === "" || x === "-" || x === "C" || x === "X";
  });
}

/** Respuesta para mostrar: A/B/C/D si la tenemos; C/X legacy: correcto→correcta, incorrecto→? */
function respuestaParaMostrar(resp: string, correcta: string, esCorrecto: boolean): string {
  const r = resp.toUpperCase().trim();
  if (OPCIONES_VALIDAS.includes(r as (typeof OPCIONES_VALIDAS)[number])) return r;
  if (esCorrecto) return correcta;
  return "?";
}

function getAciertosErrores(respuestas: string[]) {
  const aciertos: number[] = [];
  const errores: { num: number; marcado: string; correcta: string; marcadoDisplay: string }[] = [];
  const formatoCX = usaFormatoCX(respuestas);

  for (let i = 0; i < 12; i++) {
    const info = getReactivoInfo(i + 1);
    const resp = (respuestas[i] ?? "-").toUpperCase().trim();
    if (!info || resp === "-" || resp === "") {
      continue;
    }
    const correcta = info.respuestaCorrecta;
    const esCorrecto = formatoCX ? resp === "C" : resp === correcta;
    if (esCorrecto) {
      aciertos.push(i + 1);
    } else {
      errores.push({
        num: i + 1,
        marcado: resp,
        correcta,
        marcadoDisplay: respuestaParaMostrar(resp, correcta, false),
      });
    }
  }
  return { aciertos, errores };
}

export default function ModalDetalleAlumno({ alumno, cct, onClose }: Props) {
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = alumno ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [alumno, handleClose]);

  if (!alumno) return null;

  const respuestas = alumno.respuestas ?? [];
  const { aciertos, errores } = getAciertosErrores(respuestas);
  const totalCorrectas = aciertos.length;
  const totalConExamen = aciertos.length + errores.length;
  const sinExamen = totalConExamen === 0;
  const porcentajeCalculado = totalConExamen > 0 ? Math.round((totalCorrectas / totalConExamen) * 1000) / 10 : 0;
  const nivelCalculado =
    sinExamen ? alumno.nivel : porcentajeCalculado <= 50 ? "REQUIERE APOYO" : porcentajeCalculado <= 80 ? "EN DESARROLLO" : "ESPERADO";

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-alumno-titulo"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-h-[90vh] max-w-lg overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ background: "linear-gradient(135deg, #7B2D3E 0%, #9B3D4E 100%)" }}
        >
          <h2 id="modal-alumno-titulo" className="text-lg font-semibold">
            {alumno.nombre} {alumno.apellido}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="touch-target -mr-2 flex h-10 w-10 min-w-[44px] min-h-[44px] items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 active:bg-white/30 cursor-pointer"
            aria-label="Cerrar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(90vh-4rem)] overflow-y-auto px-5 py-4">
          {/* Resumen */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--fill-tertiary)] px-3 py-1 text-sm font-medium">
              {alumno.grupo}
            </span>
            {!sinExamen && (
              <span className="rounded-full bg-[var(--fill-tertiary)] px-3 py-1 text-sm font-semibold">
                {porcentajeCalculado}%
              </span>
            )}
            <span
              className="rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: NIVEL_COLOR[nivelCalculado] ?? "#757575" }}
            >
              {nivelCalculado === "REQUIERE APOYO" ? "Apoyo" : nivelCalculado === "EN DESARROLLO" ? "Desarrollo" : nivelCalculado === "ESPERADO" ? "Esperado" : nivelCalculado}
            </span>
            {cct && (
              <span className="rounded-full bg-[var(--fill-tertiary)] px-3 py-1 text-xs text-[var(--foreground)]/70">
                {cct}
              </span>
            )}
          </div>

          {sinExamen ? (
            <p className="text-sm text-[var(--foreground)]/80 italic">Sin datos de examen aplicado.</p>
          ) : (
            <>
              {/* Total aciertos */}
              <div className="mb-4 rounded-xl border border-[var(--esperado)]/40 bg-[var(--esperado)]/8 px-4 py-3">
                <p className="text-sm font-semibold text-[var(--esperado)]">
                  {totalCorrectas} de {totalConExamen} correctas
                </p>
                <p className="text-xs text-[var(--foreground)]/70 mt-0.5">
                  {errores.length} incorrecta{errores.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Grid de 12 reactivos */}
              <p className="mb-2 text-xs font-semibold text-[var(--foreground)]/80">Reactivos</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
                {Array.from({ length: 12 }, (_, i) => {
                  const num = i + 1;
                  const resp = (respuestas[i] ?? "-").toUpperCase().trim();
                  const info = getReactivoInfo(num);
                  const correcta = info?.respuestaCorrecta ?? "";
                  const formatoCX = usaFormatoCX(respuestas);
                  const esCorrecto = formatoCX ? resp === "C" : (resp !== "-" && resp !== "" && resp === correcta);
                  const esError = resp !== "-" && resp !== "" && !esCorrecto;
                  const sinResponder = resp === "-" || resp === "";
                  const letraMostrar = esCorrecto ? correcta : esError ? respuestaParaMostrar(resp, correcta, false) : null;

                  return (
                    <div
                      key={num}
                      className={`flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center ${
                        esCorrecto
                          ? "border-[var(--esperado)] bg-[var(--esperado)]/15"
                          : esError
                            ? "border-[var(--requiere-apoyo)] bg-[var(--requiere-apoyo)]/10"
                            : "border-[var(--border)] bg-[var(--fill-tertiary)]/50"
                      }`}
                      title={info ? `R${num}: ${info.evalua} - ${esCorrecto ? `Correcto (${correcta})` : esError ? `Marcó ${letraMostrar}, correcta ${correcta}` : "Sin responder"}` : ""}
                    >
                      <span className="text-[10px] font-medium text-[var(--foreground)]/70">R{num}</span>
                      {esCorrecto && <span className="text-sm font-bold text-[var(--esperado)]">✓ {correcta}</span>}
                      {esError && <span className="text-sm font-bold text-[var(--requiere-apoyo)]">✗ {letraMostrar}</span>}
                      {sinResponder && <span className="text-xs text-[var(--foreground)]/50">—</span>}
                    </div>
                  );
                })}
              </div>

              {/* Detalle de errores */}
              {errores.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--fill-tertiary)]/30 px-4 py-3">
                  <p className="text-xs font-semibold text-[var(--foreground)]/80 mb-2">Errores (Reactivo · marcó · correcta)</p>
                  {errores.some((e) => e.marcadoDisplay === "?") && (
                    <p className="text-[10px] text-[var(--foreground)]/60 mb-1.5 italic">? = la fuente no registra la opción que eligió el alumno</p>
                  )}
                  <div className="space-y-1">
                    {errores.map((e) => {
                      const info = getReactivoInfo(e.num);
                      return (
                        <div key={e.num} className="flex items-center gap-2 text-xs">
                          <span className="font-medium">R{e.num}:</span>
                          <span className="text-[var(--requiere-apoyo)]" title={e.marcadoDisplay === "?" ? "La fuente de datos no registra la opción seleccionada" : undefined}>
                            {e.marcadoDisplay}
                          </span>
                          <span>→</span>
                          <span className="text-[var(--esperado)] font-medium">{e.correcta}</span>
                          {info && (
                            <span className="text-[var(--foreground)]/60">({info.evalua})</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
