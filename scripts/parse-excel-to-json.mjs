import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data", "excel");
const OUT_DIR = path.join(ROOT, "public", "data");
const OUT_FILE = path.join(OUT_DIR, "resultados.json");

function normalizarGrupo(grupo) {
  if (grupo == null || grupo === "") return "S/G";
  const s = String(grupo).toUpperCase();
  const m = s.match(/M1([A-H])/);
  if (m) return `1${m[1]}M`;
  const v = s.match(/V1([A-H])/);
  if (v) return `1${v[1]}V`;
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

function procesarEscuela(filePath) {
  const wb = XLSX.readFile(filePath, { type: "file" });
  const first = wb.SheetNames[0];
  const sheet = wb.Sheets[first];
  const data = XLSX.utils.sheet_to_json(sheet);
  const cct = path.basename(filePath, path.extname(filePath)).replace("_actualizado", "");

  if (!data.length) return null;

  const hasQuizClass = Object.keys(data[0] || {}).some((k) => k === "QuizClass");
  const gruposSet = new Set();
  const rows = data.map((row) => {
    const grupo = hasQuizClass ? normalizarGrupo(row.QuizClass) : "UNICO";
    gruposSet.add(grupo);
    const porcentaje = calcularPorcentaje(row);
    const nivel = obtenerNivel(porcentaje);
    return {
      ...row,
      _grupo: grupo,
      _porcentaje: porcentaje,
      _nivel: nivel,
      _respuestas: Array.from({ length: 12 }, (_, i) => respuesta(row, i + 1)),
    };
  });

  const grupos = Array.from(gruposSet).filter(Boolean).sort();
  if (!grupos.length) grupos.push("UNICO");

  const aciertosEsc = new Array(12).fill(0);
  const totalesEsc = new Array(12).fill(0);
  let req = 0,
    des = 0,
    esp = 0;
  rows.forEach((r) => {
    for (let i = 1; i <= 12; i++) {
      const p = r[`Points${i}`];
      const m = r[`Mark${i}`];
      if (p != null && m != null) {
        const pv = Number(p);
        if (!Number.isNaN(pv)) {
          if (pv > 0 && String(m).trim() === "C") aciertosEsc[i - 1]++;
          totalesEsc[i - 1]++;
        }
      }
    }
    if (r._nivel === "REQUIERE APOYO") req++;
    else if (r._nivel === "EN DESARROLLO") des++;
    else esp++;
  });

  const porcentajesEsc = aciertosEsc.map((a, i) =>
    totalesEsc[i] > 0 ? Math.round((a / totalesEsc[i]) * 1000) / 10 : 0
  );

  const gruposResumen = grupos.map((nombreGrupo) => {
    const alumnosGrupo = rows.filter((r) => r._grupo === nombreGrupo);
    const aciertosG = new Array(12).fill(0);
    const totalesG = new Array(12).fill(0);
    alumnosGrupo.forEach((r) => {
      for (let i = 1; i <= 12; i++) {
        const p = r[`Points${i}`];
        const m = r[`Mark${i}`];
        if (p != null && m != null) {
          const pv = Number(p);
          if (!Number.isNaN(pv)) {
            if (pv > 0 && String(m).trim() === "C") aciertosG[i - 1]++;
            totalesG[i - 1]++;
          }
        }
      }
    });
    const porcentajesG = aciertosG.map((a, i) =>
      totalesG[i] > 0 ? Math.round((a / totalesG[i]) * 1000) / 10 : 0
    );
    const reqG = alumnosGrupo.filter((r) => r._nivel === "REQUIERE APOYO").length;
    const desG = alumnosGrupo.filter((r) => r._nivel === "EN DESARROLLO").length;
    const espG = alumnosGrupo.filter((r) => r._nivel === "ESPERADO").length;
    return {
      nombre: nombreGrupo,
      alumnos: alumnosGrupo.map((r) => ({
        nombre: String(r.FirstName ?? "").slice(0, 50),
        apellido: String(r.LastName ?? "").slice(0, 50),
        grupo: r._grupo,
        porcentaje: r._porcentaje,
        nivel: r._nivel,
        respuestas: r._respuestas,
      })),
      porcentajesReactivos: porcentajesG,
      requiereApoyo: reqG,
      enDesarrollo: desG,
      esperado: espG,
      total: alumnosGrupo.length,
    };
  });

  return {
    cct,
    totalEstudiantes: rows.length,
    porcentajesReactivos: porcentajesEsc,
    requiereApoyo: req,
    enDesarrollo: des,
    esperado: esp,
    grupos: gruposResumen,
  };
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("Carpeta data/excel creada. Coloca ahí los archivos *_actualizado.xlsx y vuelve a ejecutar.");
    const empty = { escuelas: [], generado: new Date().toISOString() };
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(empty, null, 2), "utf8");
    console.log("Creado public/data/resultados.json vacío.");
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith("_actualizado.xlsx"));
  if (!files.length) {
    console.log("No se encontraron archivos *_actualizado.xlsx en", DATA_DIR);
    const empty = { escuelas: [], generado: new Date().toISOString() };
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(empty, null, 2), "utf8");
    return;
  }

  const escuelas = [];
  for (const f of files.sort()) {
    const filePath = path.join(DATA_DIR, f);
    try {
      const res = procesarEscuela(filePath);
      if (res) escuelas.push(res);
    } catch (e) {
      console.error("Error en", f, e.message);
    }
  }

  const out = { escuelas, generado: new Date().toISOString() };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), "utf8");
  console.log("OK: " + escuelas.length + " escuelas → public/data/resultados.json");
}

main();
