import * as fs from "fs";
import * as path from "path";
import type { ResultadosRAF, EscuelaResumen, NivelRAF } from "@/types/raf";
import { fixObjectStrings } from "@/lib/utf8-fix";

const DATA_PATH = path.join(process.cwd(), "public", "data", "resultados.json");

function loadSync(): ResultadosRAF {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as ResultadosRAF;
    return fixObjectStrings(parsed);
  } catch {
    return { escuelas: [], generado: new Date().toISOString() };
  }
}

export function getResultadosSync(): ResultadosRAF {
  return loadSync();
}

export function getEscuelaSync(cct: string): EscuelaResumen | null {
  const { escuelas } = loadSync();
  return escuelas.find((e) => e.cct === cct) ?? null;
}

export function getEscuelasSync(): EscuelaResumen[] {
  return loadSync().escuelas;
}

export function getAlumnosPorNivelSync(
  nivel: NivelRAF
): { alumno: { nombre: string; apellido: string; grupo: string; porcentaje: number; nivel: NivelRAF }; cct: string }[] {
  const escuelas = loadSync().escuelas;
  const out: { alumno: { nombre: string; apellido: string; grupo: string; porcentaje: number; nivel: NivelRAF }; cct: string }[] = [];
  for (const esc of escuelas) {
    for (const g of esc.grupos) {
      for (const a of g.alumnos) {
        if (a.nivel === nivel) {
          out.push({
            alumno: {
              nombre: a.nombre,
              apellido: a.apellido,
              grupo: a.grupo,
              porcentaje: a.porcentaje,
              nivel: a.nivel,
            },
            cct: esc.cct,
          });
        }
      }
    }
  }
  return out;
}
