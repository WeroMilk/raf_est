#!/usr/bin/env node
/**
 * Ejecuta build:data:
 * - Si existe BASE_LENGUAJE y NO hay Excel de Matemáticas: merge maestra (usa resultados.json actual)
 * - Si existe BASE_LENGUAJE y SÍ hay Excel: fusion (base + Excel Matemáticas)
 * - Si no existe BASE_LENGUAJE: parse Excel Matemáticas
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE_LENGUAJE =
  process.env.BASE_LENGUAJE ||
  path.join(ROOT, "..", "Mtra. Rosa Isela", "data", "resultados.json");
const DATA_DIR = path.join(ROOT, "data", "excel");
const hasExcel = fs.existsSync(DATA_DIR) &&
  fs.readdirSync(DATA_DIR).some((f) => f.endsWith("_actualizado.xlsx"));

let script;
if (fs.existsSync(BASE_LENGUAJE)) {
  if (hasExcel) {
    script = "fusionar-base-lenguaje-matematicas.mjs";
    console.log("Usando base Lenguaje + Excel Matemáticas (fusion)");
  } else {
    script = "merge-maestra-lenguaje.mjs";
    console.log("Usando base Lenguaje + resultados.json actual (merge maestra)");
  }
} else {
  script = "parse-excel-to-json.mjs";
  console.log("Usando solo Excel Matemáticas (sin base Lenguaje)");
}

const r = spawnSync("node", [path.join(__dirname, script)], {
  stdio: "inherit",
  cwd: ROOT,
});
process.exit(r.status ?? 1);
