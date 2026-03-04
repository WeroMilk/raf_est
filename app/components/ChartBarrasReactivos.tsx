"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { COLORS } from "@/types/raf";
import { getReactivoInfo } from "@/lib/reactivos-matematicas";
import ModalReactivo from "./ModalReactivo";

const NIVEL_COLORS = [COLORS.requiereApoyo, COLORS.enDesarrollo, COLORS.esperado];

function getColor(value: number) {
  if (value <= 50) return NIVEL_COLORS[0];
  if (value <= 80) return NIVEL_COLORS[1];
  return NIVEL_COLORS[2];
}

interface Props {
  porcentajes: number[];
  title?: string;
  totalAlumnos?: number;
}

function TooltipAciertos(props: { active?: boolean; payload?: { payload: { reactivo: string; porcentaje: number; aciertos?: number } }[] }) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const aciertos = row.aciertos ?? null;
  return (
    <div className="rounded border border-border bg-card px-2 py-1.5 text-xs shadow">
      <div className="font-semibold">
        {aciertos != null
          ? `${aciertos} ${aciertos === 1 ? "persona contestó bien" : "personas contestaron bien"}`
          : `Reactivo ${row.reactivo}`}
      </div>
      <div className="text-foreground/80">{row.porcentaje}%</div>
    </div>
  );
}

export default function ChartBarrasReactivos({ porcentajes, title, totalAlumnos }: Props) {
  const [mounted, setMounted] = useState(false);
  const [reactivoSeleccionado, setReactivoSeleccionado] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);

  const data = porcentajes.map((p, i) => ({
    reactivo: `${i + 1}`,
    numero: i + 1,
    porcentaje: p,
    fill: getColor(p),
    aciertos: totalAlumnos != null ? Math.round((p / 100) * totalAlumnos) : undefined,
  }));

  const chartContainerClass = "h-24 w-full min-w-0 min-h-[6rem] sm:h-28 sm:min-h-[7rem] outline-none";

  const handleBarClick = (entry: unknown, index?: number) => {
    const payload = entry as { numero?: number };
    const num = payload?.numero ?? (index != null ? index + 1 : null);
    if (typeof num === "number" && num >= 1 && num <= 12) {
      setReactivoSeleccionado(num);
    }
  };

  const info = reactivoSeleccionado ? getReactivoInfo(reactivoSeleccionado) ?? null : null;

  return (
    <div className="chart-no-focus w-full min-w-0 outline-none" tabIndex={-1}>
      {title && <h3 className="mb-1 text-xs font-semibold">{title}</h3>}
      <p className="mb-1 text-[11px] text-[var(--foreground)]/60">Toca una barra para ver el reactivo</p>
      <div className={`${chartContainerClass} cursor-pointer`} tabIndex={-1}>
        {!mounted ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-[var(--fill-tertiary)]" aria-hidden />
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="reactivo" tick={{ fontSize: 8 }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 8 }}
              tickFormatter={(v) => `${v}%`}
              width={28}
            />
            <Tooltip content={<TooltipAciertos />} />
            <Bar
              dataKey="porcentaje"
              radius={[2, 2, 0, 0]}
              label={{ position: "top", fontSize: 7 }}
              onClick={handleBarClick}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={data[i].fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
      <ModalReactivo reactivo={info} onClose={() => setReactivoSeleccionado(null)} />
    </div>
  );
}
