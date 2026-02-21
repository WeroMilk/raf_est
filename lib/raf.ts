import type { NivelRAF } from "@/types/raf";

export function normalizarGrupo(grupo: unknown): string {
  if (grupo == null || grupo === "") return "S/G";
  const s = String(grupo).toUpperCase();
  const m = s.match(/M1([A-H])/);
  if (m) return `1${m[1]}M`;
  const v = s.match(/V1([A-H])/);
  if (v) return `1${v[1]}V`;
  return s.slice(0, 10);
}

export function obtenerNivel(porcentaje: number | null | undefined): NivelRAF {
  if (porcentaje == null) return "REQUIERE APOYO";
  if (porcentaje <= 50) return "REQUIERE APOYO";
  if (porcentaje <= 80) return "EN DESARROLLO";
  return "ESPERADO";
}

export function calcularPorcentajeEstudiante(row: Record<string, unknown>): number {
  let aciertos = 0;
  let total = 0;
  for (let i = 1; i <= 12; i++) {
    const points = row[`Points${i}`];
    const mark = row[`Mark${i}`];
    if (points == null || mark == null) continue;
    const p = Number(points);
    const m = String(mark).trim();
    if (Number.isNaN(p)) continue;
    if (p > 0 && m === "C") {
      aciertos++;
      total++;
    } else if (p === 0) {
      total++;
    }
  }
  if (total === 0) return 0;
  return Math.round((aciertos / total) * 1000) / 10;
}

export function respuestaEstudiante(row: Record<string, unknown>, reactivo: number): string {
  const m = row[`Mark${reactivo}`];
  if (m != null && String(m).trim()) return String(m).trim();
  return "-";
}
