/**
 * Aplica normalizarGrupo a todos los nombres de grupo en public/data/resultados.json
 * y fusiona grupos que queden con el mismo nombre (ej. Z11EST56V1 → 1AV).
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_FILE = path.join(ROOT, "public", "data", "resultados.json");

const LETRA_GRUPO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function normalizarGrupo(grupo) {
  if (grupo == null || grupo === "") return "S/G";
  const s = String(grupo).toUpperCase().trim();
  if (/^[1-3][A-Z][MV]$/.test(s)) return s;
  const m = s.match(/M1([A-H])/);
  if (m) return `1${m[1]}M`;
  const v = s.match(/V1([A-H])/);
  if (v) return `1${v[1]}V`;
  const zNum = s.match(/^Z(\d)(\d)EST[\d]*(M|V)\d*$/);
  if (zNum) {
    const grado = zNum[1];
    const numGrupo = parseInt(zNum[2], 10);
    const turno = zNum[3];
    const letra = LETRA_GRUPO[numGrupo - 1] || LETRA_GRUPO[0];
    return `${grado}${letra}${turno}`;
  }
  const zLetra = s.match(/^Z\d+EST[\d]*(M|V)(\d)([A-Z])$/);
  if (zLetra) {
    const turno = zLetra[1];
    const grado = zLetra[2];
    const letra = zLetra[3];
    return `${grado}${letra}${turno}`;
  }
  return s.slice(0, 10);
}

function obtenerNivel(porcentaje) {
  if (porcentaje == null) return "REQUIERE APOYO";
  if (porcentaje <= 50) return "REQUIERE APOYO";
  if (porcentaje <= 80) return "EN DESARROLLO";
  return "ESPERADO";
}

function main() {
  if (!fs.existsSync(OUT_FILE)) {
    console.error("No existe", OUT_FILE);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
  if (!data.escuelas || !Array.isArray(data.escuelas)) {
    console.error("resultados.json no tiene escuelas");
    process.exit(1);
  }

  for (const esc of data.escuelas) {
    if (!esc.grupos) continue;
    const alumnosByGrupo = new Map();
    for (const g of esc.grupos) {
      const nombreNuevo = normalizarGrupo(g.nombre);
      for (const a of g.alumnos || []) {
        const alumno = { ...a, grupo: normalizarGrupo(a.grupo) };
        if (!alumnosByGrupo.has(nombreNuevo)) alumnosByGrupo.set(nombreNuevo, []);
        alumnosByGrupo.get(nombreNuevo).push(alumno);
      }
    }
    const nuevosGrupos = [];
    for (const [nombreGrupo, alumnos] of alumnosByGrupo.entries()) {
      const aciertosG = new Array(12).fill(0);
      const totalesG = new Array(12).fill(0);
      alumnos.forEach((r) => {
        const resp = r.respuestas || r._respuestas || [];
        for (let i = 0; i < 12; i++) {
          if (i < resp.length) {
            totalesG[i]++;
            if (String(resp[i]).trim() === "C") aciertosG[i]++;
          }
        }
      });
      const porcentajesG = aciertosG.map((a, i) =>
        totalesG[i] > 0 ? Math.round((a / totalesG[i]) * 1000) / 10 : 0
      );
      const reqG = alumnos.filter((r) => (r._nivel ?? r.nivel) === "REQUIERE APOYO").length;
      const desG = alumnos.filter((r) => (r._nivel ?? r.nivel) === "EN DESARROLLO").length;
      const espG = alumnos.filter((r) => (r._nivel ?? r.nivel) === "ESPERADO").length;
      const alumnosOut = alumnos.map((r) => ({
        nombre: r.nombre,
        apellido: r.apellido,
        grupo: nombreGrupo,
        porcentaje: r._porcentaje ?? r.porcentaje,
        nivel: r._nivel ?? r.nivel,
        respuestas: r._respuestas ?? r.respuestas ?? [],
      }));
      nuevosGrupos.push({
        nombre: nombreGrupo,
        alumnos: alumnosOut,
        porcentajesReactivos: porcentajesG,
        requiereApoyo: reqG,
        enDesarrollo: desG,
        esperado: espG,
        total: alumnos.length,
      });
    }
    esc.grupos = nuevosGrupos.sort((a, b) => (a.nombre < b.nombre ? -1 : a.nombre > b.nombre ? 1 : 0));
  }

  data.generado = new Date().toISOString();
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), "utf8");
  console.log("OK: grupos normalizados en", OUT_FILE);
}

main();
