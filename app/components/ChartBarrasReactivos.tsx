"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { COLORS } from "@/types/raf";

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
  const data = porcentajes.map((p, i) => ({
    reactivo: `${i + 1}`,
    porcentaje: p,
    fill: getColor(p),
    aciertos: totalAlumnos != null ? Math.round((p / 100) * totalAlumnos) : undefined,
  }));
  return (
    <div className="chart-no-focus w-full min-w-0 outline-none" tabIndex={-1}>
      {title && <h3 className="mb-1 text-xs font-semibold">{title}</h3>}
      <div className="h-24 w-full min-w-0 sm:h-28 outline-none" tabIndex={-1}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="reactivo" tick={{ fontSize: 8 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} unit="%" width={24} />
            <Tooltip content={<TooltipAciertos />} />
            <Bar dataKey="porcentaje" radius={[2, 2, 0, 0]} label={{ position: "top", fontSize: 7 }}>
              {data.map((_, i) => (
                <Cell key={i} fill={data[i].fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
