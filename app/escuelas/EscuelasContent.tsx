"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { NIVEL_COLOR } from "@/types/raf";
import type { EscuelaResumen } from "@/types/raf";

type SortOption = "numero-asc" | "numero-desc" | "categoria";

function getNivel(escuela: EscuelaResumen): "REQUIERE APOYO" | "EN DESARROLLO" | "ESPERADO" {
  const total = escuela.requiereApoyo + escuela.enDesarrollo + escuela.esperado;
  if (total === 0) return "REQUIERE APOYO";
  if (escuela.requiereApoyo / total > 0.5) return "REQUIERE APOYO";
  if (escuela.esperado / total >= 0.5) return "ESPERADO";
  return "EN DESARROLLO";
}

const CATEGORIA_ORDER = { "REQUIERE APOYO": 0, "EN DESARROLLO": 1, ESPERADO: 2 };

interface Props {
  escuelas: EscuelaResumen[];
}

export default function EscuelasContent({ escuelas }: Props) {
  const [sort, setSort] = useState<SortOption>("numero-asc");

  const sorted = useMemo(() => {
    const list = escuelas.map((e) => ({ escuela: e, nivel: getNivel(e) }));
    if (sort === "numero-asc") return list.sort((a, b) => a.escuela.cct.localeCompare(b.escuela.cct));
    if (sort === "numero-desc") return list.sort((a, b) => b.escuela.cct.localeCompare(a.escuela.cct));
    return list.sort((a, b) => CATEGORIA_ORDER[a.nivel] - CATEGORIA_ORDER[b.nivel]);
  }, [escuelas, sort]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 pb-6 min-w-0">
      <div className="card-ios shrink-0 space-y-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
          Ordenar
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSort("numero-asc")}
            className={`btn-ios rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              sort === "numero-asc"
                ? "bg-[#8e8e93] text-white"
                : "bg-[var(--fill-tertiary)] text-foreground hover:bg-[var(--fill-secondary)]"
            }`}
          >
            Nº ascendente
          </button>
          <button
            type="button"
            onClick={() => setSort("numero-desc")}
            className={`btn-ios rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              sort === "numero-desc"
                ? "bg-[#8e8e93] text-white"
                : "bg-[var(--fill-tertiary)] text-foreground hover:bg-[var(--fill-secondary)]"
            }`}
          >
            Nº descendente
          </button>
          <button
            type="button"
            onClick={() => setSort("categoria")}
            className={`btn-ios rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              sort === "categoria"
                ? "bg-[#8e8e93] text-white"
                : "bg-[var(--fill-tertiary)] text-foreground hover:bg-[var(--fill-secondary)]"
            }`}
          >
            Por categoría
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 content-start">
        {sorted.map(({ escuela: e, nivel }, i) => {
          const color = NIVEL_COLOR[nivel];
          const tagLabel =
            nivel === "REQUIERE APOYO" ? "Apoyo" : nivel === "EN DESARROLLO" ? "Desarrollo" : "Esperado";
          return (
            <li
              key={e.cct}
              className="min-w-0 animate-stagger-in opacity-0"
              style={{ animationDelay: `${Math.min(i * 25, 400)}ms` }}
            >
              <Link
                href={`/escuela/${e.cct}`}
                className="link-ios card-ios flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-2.5 text-center shadow-sm"
              >
                <span className="truncate w-full text-xs font-semibold leading-tight" title={e.buscador?.nombre ?? e.cct}>
                  {e.buscador?.nombre ?? e.cct}
                </span>
                <span className="mt-0.5 truncate w-full text-[10px] text-foreground/70">{e.cct}</span>
                <span
                  className="mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: color }}
                >
                  {tagLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
