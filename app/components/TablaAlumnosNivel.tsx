"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { NivelRAF } from "@/types/raf";

type Row = {
  alumno: { nombre: string; apellido: string; grupo: string; porcentaje: number | null; nivel: NivelRAF };
  cct: string;
};

type SortCol = "alumno" | "grupo" | "porcentaje" | "cct";

interface Props {
  alumnosConCct: Row[];
  maxRows?: number;
  verTodosHref?: string;
}

export default function TablaAlumnosNivel({ alumnosConCct, maxRows, verTodosHref }: Props) {
  const [filtro, setFiltro] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("porcentaje");
  const [sortAsc, setSortAsc] = useState(false);

  const filtrados = useMemo(
    () =>
      filtro
        ? alumnosConCct.filter(
            (r) =>
              r.cct.toLowerCase().includes(filtro.toLowerCase()) ||
              `${r.alumno.nombre} ${r.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())
          )
        : alumnosConCct,
    [alumnosConCct, filtro]
  );

  const ordenados = useMemo(() => {
    const dir = sortAsc ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      if (sortCol === "alumno") {
        const na = `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase();
        const nb = `${b.alumno.nombre} ${b.alumno.apellido}`.toLowerCase();
        return dir * (na < nb ? -1 : na > nb ? 1 : 0);
      }
      if (sortCol === "grupo") {
        return dir * (a.alumno.grupo < b.alumno.grupo ? -1 : a.alumno.grupo > b.alumno.grupo ? 1 : 0);
      }
      if (sortCol === "porcentaje") {
        const pa = a.alumno.porcentaje ?? 0;
        const pb = b.alumno.porcentaje ?? 0;
        return dir * (pa - pb);
      }
      return dir * (a.cct < b.cct ? -1 : a.cct > b.cct ? 1 : 0);
    });
  }, [filtrados, sortCol, sortAsc]);

  const limit = maxRows ?? ordenados.length;
  const visibles = ordenados.slice(0, limit);
  const total = ordenados.length;
  const hayMas = total > limit;
  const mostrarVerTodos = hayMas && maxRows != null && verTodosHref;

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortAsc((s) => !s);
    else {
      setSortCol(col);
      setSortAsc(col === "porcentaje" ? false : true);
    }
  };

  const Th = ({ col, label }: { col: SortCol; label: string }) => (
    <th className="px-0.5 py-1 sm:py-0.5">
      <button
        type="button"
        onClick={() => handleSort(col)}
        className="touch-target min-h-[44px] w-full text-left font-semibold underline decoration-dotted hover:opacity-80 sm:min-h-0 sm:min-w-0"
        title={`Ordenar por ${label}`}
      >
        {label}
        {sortCol === col && (sortAsc ? " ↑" : " ↓")}
      </button>
    </th>
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-col size-full max-w-full">
      <div className="mb-0.5 shrink-0">
        <input
          type="search"
          placeholder="Buscar..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full rounded border border-border bg-background px-1.5 py-0.5 text-[10px]"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[220px] text-left text-[10px] sm:text-xs" role="grid">
          <thead>
            <tr className="border-b border-border font-semibold">
              <Th col="alumno" label="Alumno" />
              <Th col="grupo" label="Grupo" />
              <Th col="porcentaje" label="%" />
              <Th col="cct" label="CCT" />
            </tr>
          </thead>
          <tbody>
            {visibles.map((r, i) => (
              <tr key={i} className="border-b border-border/50 transition-colors duration-150 hover:bg-[var(--fill-tertiary)]">
                <td className="px-0.5 py-px">{r.alumno.nombre} {r.alumno.apellido}</td>
                <td className="px-0.5 py-px">{r.alumno.grupo}</td>
                <td className="px-0.5 py-px">{r.alumno.porcentaje != null ? `${r.alumno.porcentaje}%` : "—"}</td>
                <td className="px-0.5 py-px text-foreground/70">{r.cct}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {mostrarVerTodos && (
          <p className="mt-1 text-center">
            <Link
              href={verTodosHref}
              className="text-[10px] font-medium text-[var(--gris-iphone)] underline hover:opacity-80"
            >
              Ver todos ({total})
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
