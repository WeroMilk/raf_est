#!/usr/bin/env node
/**
 * Fusiona datos del Excel "Buscador de Escuelas en Línea" con public/data/resultados.json.
 * Añade a cada escuela los campos: nombre, turno, domicilio, teléfono, colonia, localidad, municipio, etc.
 *
 * Uso:
 *   node scripts/merge-buscador-escuelas.mjs
 *   node scripts/merge-buscador-escuelas.mjs "C:\Users\...\Buscador de Escuelas en Linea.xlsx"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESULTADOS_PATH = path.join(ROOT, "public", "data", "resultados.json");

const DEFAULT_EXCEL =
  process.env.BUSCADOR_EXCEL ||
  path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads", "Buscador de Escuelas en Linea.xlsx");

const COLUMNAS = [
  "CCT",
  "NOMBRE",
  "TURNO",
  "NIVEL EDUCATIVO",
  "ZONA",
  "DOMICILIO",
  "TELÉFONO",
  "COLONIA",
  "LOCALIDAD",
  "MUNICIPIO",
  "ALUMNOS",
];

function buildMapFromExcel(filePath) {
  const wb = XLSX.readFile(filePath, { type: "file" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (rows.length < 2) return new Map();
  const headerRow = rows[1].map((h) => (h != null ? String(h).trim().toUpperCase() : ""));
  const idx = {};
  COLUMNAS.forEach((col) => {
    const i = headerRow.indexOf(col.toUpperCase());
    if (i >= 0) idx[col] = i;
  });
  const map = new Map();
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const cct = row[idx["CCT"]] != null ? String(row[idx["CCT"]]).trim() : "";
    if (!cct) continue;
    const get = (col) => {
      const j = idx[col];
      if (j == null) return undefined;
      const v = row[j];
      return v != null && v !== "" ? String(v).trim() : undefined;
    };
    map.set(cct, {
      nombre: get("NOMBRE"),
      turno: get("TURNO"),
      nivelEducativo: get("NIVEL EDUCATIVO"),
      zona: get("ZONA"),
      domicilio: get("DOMICILIO"),
      telefono: get("TELÉFONO"),
      colonia: get("COLONIA"),
      localidad: get("LOCALIDAD"),
      municipio: get("MUNICIPIO"),
    });
  }
  return map;
}

function main() {
  const excelPath = process.argv[2] || DEFAULT_EXCEL;
  if (!fs.existsSync(excelPath)) {
    console.error("No se encontró el Excel:", excelPath);
    console.error("Uso: node scripts/merge-buscador-escuelas.mjs [ruta/al/Buscador de Escuelas en Linea.xlsx]");
    process.exit(1);
  }

  if (!fs.existsSync(RESULTADOS_PATH)) {
    console.error("No existe public/data/resultados.json. Ejecuta antes npm run build:data");
    process.exit(1);
  }

  const buscadorMap = buildMapFromExcel(excelPath);
  console.log("CCTs en Buscador:", buscadorMap.size);

  const resultados = JSON.parse(fs.readFileSync(RESULTADOS_PATH, "utf8"));
  let merged = 0;
  for (const esc of resultados.escuelas || []) {
    const info = buscadorMap.get(esc.cct);
    if (info) {
      esc.buscador = info;
      merged++;
    }
  }

  fs.writeFileSync(RESULTADOS_PATH, JSON.stringify(resultados, null, 2), "utf8");
  console.log("Escuelas en resultados:", (resultados.escuelas || []).length);
  console.log("Escuelas actualizadas con datos del Buscador:", merged);
  console.log("Guardado:", RESULTADOS_PATH);
}

main();
