"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { NivelRAF } from "@/types/raf";
import { NIVELES, NIVEL_COLOR } from "@/types/raf";
import TablaAlumnosNivel from "@/app/components/TablaAlumnosNivel";

export type RowNivel = {
  alumno: { nombre: string; apellido: string; grupo: string; porcentaje: number; nivel: NivelRAF };
  cct: string;
};

type ViewMode = "todos" | "escuela" | "grupo";
type SortOrder = "asc" | "desc";

type GrupoOption = { cct: string; grupo: string; label: string };

interface Props {
  alumnosPorNivel: Record<NivelRAF, RowNivel[]>;
  escuelas: { cct: string }[];
  gruposOptions: GrupoOption[];
  nivelFiltro?: NivelRAF | null;
  soloCct?: string;
  initialGrupo?: string;
}

const NIVEL_TO_PARAM: Record<NivelRAF, string> = {
  "REQUIERE APOYO": "REQUIERE_APOYO",
  "EN DESARROLLO": "EN_DESARROLLO",
  ESPERADO: "ESPERADO",
};

export default function PorNivelContent({
  alumnosPorNivel,
  escuelas,
  gruposOptions,
  nivelFiltro = null,
  soloCct,
  initialGrupo = "",
}: Props) {
  const grupoValido =
    initialGrupo &&
    gruposOptions.some(
      (o) => `${o.cct}|${o.grupo}` === initialGrupo
    );
  const [viewMode, setViewMode] = useState<ViewMode>(
    grupoValido ? "grupo" : soloCct ? "escuela" : "todos"
  );
  const [selectedCct, setSelectedCct] = useState(soloCct ?? "");
  const [selectedGrupo, setSelectedGrupo] = useState(grupoValido ? initialGrupo : "");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const router = useRouter();

  const dataPorNivel = useMemo(() => {
    const filterRow = (r: RowNivel) => {
      if (viewMode === "todos") return true;
      if (viewMode === "escuela") return r.cct === selectedCct;
      if (viewMode === "grupo") {
        const [cct, grupo] = selectedGrupo.split("|");
        return r.cct === cct && r.alumno.grupo === grupo;
      }
      return true;
    };
    const sortRows = (rows: RowNivel[]) =>
      [...rows].sort((a, b) =>
        sortOrder === "asc"
          ? a.alumno.porcentaje - b.alumno.porcentaje
          : b.alumno.porcentaje - a.alumno.porcentaje
      );
    const out: Record<NivelRAF, RowNivel[]> = {
      "REQUIERE APOYO": [],
      "EN DESARROLLO": [],
      ESPERADO: [],
    };
    for (const nivel of NIVELES) {
      const filtered = alumnosPorNivel[nivel].filter(filterRow);
      out[nivel] = sortRows(filtered);
    }
    return out;
  }, [alumnosPorNivel, viewMode, selectedCct, selectedGrupo, sortOrder]);

  const [expandedNivel, setExpandedNivel] = useState<NivelRAF | null>(nivelFiltro);
  useEffect(() => {
    setExpandedNivel(nivelFiltro);
  }, [nivelFiltro]);
  const nivelesAMostrar = expandedNivel ? [expandedNivel] : NIVELES;
  const usarListaReducida = !expandedNivel;

  const handleVerLos3 = () => {
    setExpandedNivel(null);
    router.push("/por-nivel");
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 p-2 pb-2 animate-fade-in overflow-hidden">
      <header className="shrink-0 space-y-0.5">
        <h1 className="text-base font-bold mt-0">
          {expandedNivel
            ? `Por nivel: ${expandedNivel === "REQUIERE APOYO" ? "Requieren apoyo" : expandedNivel === "EN DESARROLLO" ? "En desarrollo" : "Esperado"}`
            : "Por nivel"}
        </h1>
        <p className="text-xs text-foreground/80">
          {expandedNivel
            ? "Lista completa. Toca «Ver los 3 niveles» para volver."
            : "Toca una sección para ver solo esa lista. Organiza por escuela o grupo y ordena por %."}
        </p>
        {expandedNivel && (
          <button
            type="button"
            onClick={handleVerLos3}
            className="block text-left text-xs font-medium text-[var(--gris-iphone)] underline hover:opacity-80"
          >
            ← Ver los 3 niveles
          </button>
        )}
      </header>

      <section className="card-ios shrink-0 space-y-2 rounded-2xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          {!soloCct && (
            <>
              <label className="text-xs font-semibold">Organizar por:</label>
              <select
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value as ViewMode);
                  if (e.target.value !== "escuela") setSelectedCct("");
                  if (e.target.value !== "grupo") setSelectedGrupo("");
                }}
                className="select-ios rounded-xl border border-border bg-[var(--fill-tertiary)] px-3 py-2 text-xs"
              >
                <option value="todos">Todas las escuelas</option>
                <option value="escuela">Por escuela</option>
                <option value="grupo">Por grupo</option>
              </select>

              {viewMode === "escuela" && (
                <select
                  value={selectedCct}
                  onChange={(e) => setSelectedCct(e.target.value)}
                  className="select-ios min-w-[120px] rounded-xl border border-border bg-[var(--fill-tertiary)] px-3 py-2 text-xs"
                >
                  <option value="">Selecciona escuela</option>
                  {escuelas.map((e) => (
                    <option key={e.cct} value={e.cct}>
                      {e.cct}
                    </option>
                  ))}
                </select>
              )}

              {viewMode === "grupo" && (
                <select
                  value={selectedGrupo}
                  onChange={(e) => setSelectedGrupo(e.target.value)}
                  className="select-ios min-w-[140px] rounded-xl border border-border bg-[var(--fill-tertiary)] px-3 py-2 text-xs"
                >
                  <option value="">Selecciona grupo</option>
                  {gruposOptions.map((opt) => (
                    <option key={`${opt.cct}-${opt.grupo}`} value={`${opt.cct}|${opt.grupo}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
          {soloCct && <span className="text-xs text-foreground/70">Solo tu escuela: {soloCct}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold">Ordenar %:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="select-ios rounded-xl border border-border bg-[var(--fill-tertiary)] px-3 py-2 text-xs"
          >
            <option value="desc">Descendente (mayor a menor)</option>
            <option value="asc">Ascendente (menor a mayor)</option>
          </select>
        </div>
      </section>

      <div
        className={`flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden ${!expandedNivel ? "pb-4" : ""}`}
      >
        {nivelesAMostrar.map((nivel) => {
          const alumnos = dataPorNivel[nivel];
          const color = NIVEL_COLOR[nivel];
          const label =
            nivel === "REQUIERE APOYO"
              ? "Requieren apoyo"
              : nivel === "EN DESARROLLO"
                ? "En desarrollo"
                : "Esperado";
          const isExpanded = !!expandedNivel;
          return (
            <section
              key={nivel}
              className="card-ios flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card p-2 overflow-hidden"
              {...(!isExpanded && {
                role: "button",
                tabIndex: 0,
                onClick: () => {
                  setExpandedNivel(nivel);
                  router.push(`/por-nivel?nivel=${NIVEL_TO_PARAM[nivel]}`);
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setExpandedNivel(nivel);
                    router.push(`/por-nivel?nivel=${NIVEL_TO_PARAM[nivel]}`);
                  }
                },
              })}
            >
              <h2
                className="mb-1 shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {label} ({alumnos.length}){!isExpanded ? " — toca para ampliar" : ""}
              </h2>
              <div
                className={`min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain ${isExpanded ? "lista-expandida-por-nivel" : "lista-mini-por-nivel"}`}
                style={{ WebkitOverflowScrolling: "touch", minHeight: 0 }}
                onClick={isExpanded ? undefined : (e) => e.stopPropagation()}
              >
                <TablaAlumnosNivel
                  alumnosConCct={alumnos}
                  maxRows={undefined}
                  verTodosHref={undefined}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
