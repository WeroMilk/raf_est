#!/usr/bin/env node
/**
 * Fusiona la base de escuelas/grupos/alumnos del proyecto Lenguaje (Rosa Isela)
 * con los resultados del examen de Matemáticas.
 *
 * Usa la estructura completa del Lenguaje (226 alumnos, 11 grupos) y añade
 * los resultados de Matemáticas a cada alumno. Los que no aplicaron examen
 * quedan con porcentaje 0 y nivel "REQUIERE APOYO".
 *
 * Uso:
 *   BASE_LENGUAJE="C:/Users/alfon/proyectos/Mtra. Rosa Isela/data/resultados.json" npm run build:data
 *   o definir BASE_LENGUAJE en .env
 *
 * O ejecutar directamente:
 *   node scripts/fusionar-base-lenguaje-matematicas.mjs
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE_LENGUAJE =
  process.env.BASE_LENGUAJE ||
  path.join(ROOT, "..", "Mtra. Rosa Isela", "data", "resultados.json");
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data", "excel");
const OUT_DIR = path.join(ROOT, "public", "data");
const OUT_FILE = path.join(OUT_DIR, "resultados.json");

const LETRA_GRUPO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function fixUtf8Mojibake(str) {
  if (typeof str !== "string") return str;
  if (!/Ã[\x80-\xBF]/.test(str)) return str;
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

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

function calcularPorcentaje(row) {
  let aciertos = 0,
    total = 0;
  for (let i = 1; i <= 12; i++) {
    const p = row[`Points${i}`];
    const m = row[`Mark${i}`];
    if (p == null || m == null) continue;
    const pv = Number(p);
    const mv = String(m).trim();
    if (Number.isNaN(pv)) continue;
    if (pv > 0 && mv === "C") {
      aciertos++;
      total++;
    } else if (pv === 0) total++;
  }
  return total > 0 ? Math.round((aciertos / total) * 1000) / 10 : 0;
}

function respuesta(row, i) {
  const m = row[`Mark${i}`];
  return m != null && String(m).trim() ? String(m).trim() : "-";
}

/** Clave para buscar alumno: normaliza nombre para matching */
function claveAlumno(cct, grupo, nombre, apellido) {
  const n = `${(nombre || "").trim().toUpperCase()}`;
  const a = `${(apellido || "").trim().toUpperCase()}`;
  const g = normalizarGrupo(grupo);
  return `${cct}|${g}|${n}|${a}`;
}

/** Extrae resultados de matemáticas desde los Excel */
function extraerResultadosMatematicas() {
  const map = new Map();
  if (!fs.existsSync(DATA_DIR)) return map;
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith("_actualizado.xlsx"));
  for (const f of files) {
    const filePath = path.join(DATA_DIR, f);
    const cct = f.replace("_actualizado.xlsx", "");
    try {
      const wb = XLSX.readFile(filePath, { type: "file" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      const hasQuizClass = Object.keys(data[0] || {}).some((k) => k === "QuizClass");
      const grupoCol = hasQuizClass ? "QuizClass" : null;
      for (const row of data) {
        const grupoRaw = grupoCol ? fixUtf8Mojibake(String(row[grupoCol] ?? "")) : "";
        const grupo = grupoRaw ? normalizarGrupo(grupoRaw) : "UNICO";
        const nombre = fixUtf8Mojibake(String(row.FirstName ?? "")).trim().slice(0, 50);
        const apellido = fixUtf8Mojibake(String(row.LastName ?? "")).trim().slice(0, 50);
        const porcentaje = calcularPorcentaje(row);
        const nivel = obtenerNivel(porcentaje);
        const respuestas = Array.from({ length: 12 }, (_, i) => respuesta(row, i + 1));
        const key = claveAlumno(cct, grupo, nombre, apellido);
        map.set(key, { porcentaje, nivel, respuestas });
      }
    } catch (e) {
      console.warn("Error leyendo", f, e.message);
    }
  }
  return map;
}

function main() {
  if (!fs.existsSync(BASE_LENGUAJE)) {
    console.error("No se encontró base de Lenguaje:", BASE_LENGUAJE);
    console.error("Define BASE_LENGUAJE con la ruta a data/resultados.json del proyecto Rosa Isela.");
    console.error("Ejemplo: BASE_LENGUAJE=\"C:/ruta/Mtra. Rosa Isela/data/resultados.json\" node scripts/fusionar-base-lenguaje-matematicas.mjs");
    process.exit(1);
  }

  const baseLenguaje = JSON.parse(fs.readFileSync(BASE_LENGUAJE, "utf8"));
  const resultadosMat = extraerResultadosMatematicas();
  console.log("Base Lenguaje:", BASE_LENGUAJE);
  console.log("Alumnos con resultados Matemáticas:", resultadosMat.size);

  const escuelasOut = [];
  for (const esc of baseLenguaje.escuelas || []) {
    const cct = esc.cct;
    const gruposOut = [];
    let totalReq = 0,
      totalDes = 0,
      totalEsp = 0;
    const aciertosEsc = new Array(12).fill(0);
    const totalesEsc = new Array(12).fill(0);

    for (const grp of esc.grupos || []) {
      const nombreGrupo = grp.nombre;
      const alumnosOut = [];
      const aciertosG = new Array(12).fill(0);
      const totalesG = new Array(12).fill(0);
      let reqG = 0,
        desG = 0,
        espG = 0;

      for (const alu of grp.alumnos || []) {
        const key = claveAlumno(cct, nombreGrupo, alu.nombre, alu.apellido);
        const mat = resultadosMat.get(key);
        const porcentaje = mat ? mat.porcentaje : 0;
        const nivel = mat ? mat.nivel : "REQUIERE APOYO";
        const respuestas = mat ? mat.respuestas : Array(12).fill("-");

        alumnosOut.push({
          nombre: (alu.nombre || "").slice(0, 50),
          apellido: (alu.apellido || "").slice(0, 50),
          grupo: nombreGrupo,
          porcentaje,
          nivel,
          respuestas,
        });

        if (mat) {
          if (nivel === "REQUIERE APOYO") {
            reqG++;
            totalReq++;
          } else if (nivel === "EN DESARROLLO") {
            desG++;
            totalDes++;
          } else {
            espG++;
            totalEsp++;
          }
          for (let i = 0; i < 12; i++) {
            if (mat.respuestas[i] === "C") {
              aciertosG[i]++;
              aciertosEsc[i]++;
            }
            totalesG[i]++;
            totalesEsc[i]++;
          }
        }
      }

      const porcentajesG = aciertosG.map((a, i) =>
        totalesG[i] > 0 ? Math.round((a / totalesG[i]) * 1000) / 10 : 0
      );

      gruposOut.push({
        nombre: nombreGrupo,
        alumnos: alumnosOut,
        porcentajesReactivos: porcentajesG,
        requiereApoyo: reqG,
        enDesarrollo: desG,
        esperado: espG,
        total: alumnosOut.length,
      });
    }

    const porcentajesEsc = aciertosEsc.map((a, i) =>
      totalesEsc[i] > 0 ? Math.round((a / totalesEsc[i]) * 1000) / 10 : 0
    );

    const totalAlumnos = (esc.grupos || []).reduce((s, g) => s + (g.alumnos || []).length, 0);

    escuelasOut.push({
      cct,
      totalEstudiantes: totalAlumnos,
      porcentajesReactivos: porcentajesEsc,
      requiereApoyo: totalReq,
      enDesarrollo: totalDes,
      esperado: totalEsp,
      grupos: gruposOut,
      buscador: esc.buscador,
    });
  }

  const out = {
    escuelas: escuelasOut,
    generado: new Date().toISOString(),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), "utf8");
  console.log("OK:", escuelasOut.length, "escuelas, base Lenguaje fusionada con Matemáticas →", OUT_FILE);
}

main();
