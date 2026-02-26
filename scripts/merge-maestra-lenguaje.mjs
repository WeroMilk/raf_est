#!/usr/bin/env node
/**
 * Unifica la base de datos de escuelas, grupos y alumnos entre RAF Lenguaje (Rosa Isela)
 * y RAF Matemáticas (Marta Camargo).
 *
 * Usa la estructura de Rosa Isela (más completa: 226 alumnos, 11 grupos) como base maestra
 * y combina con los resultados de Matemáticas. Los alumnos que no aplicaron el examen
 * de matemáticas aparecen con nivel "SIN EXAMEN".
 *
 * Uso:
 *   node scripts/merge-maestra-lenguaje.mjs
 *   node scripts/merge-maestra-lenguaje.mjs "C:\...\Mtra. Rosa Isela"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_MARTA = path.resolve(__dirname, "..");
const ROOT_ROSA = process.argv[2] || path.resolve(ROOT_MARTA, "..", "Mtra. Rosa Isela");

const MAESTRA_PATH = path.join(ROOT_ROSA, "data", "resultados.json");
const MAT_PATH = path.join(ROOT_MARTA, "public", "data", "resultados.json");
const OUT_PATH = path.join(ROOT_MARTA, "public", "data", "resultados.json");

const NUM_REACTIVOS = 12;

function keyAlumno(cct, grupo, nombre, apellido) {
  const n = String(nombre ?? "").toUpperCase().trim();
  const a = String(apellido ?? "").toUpperCase().trim();
  const g = String(grupo ?? "").trim();
  return `${cct}|${g}|${n}|${a}`;
}

function main() {
  if (!fs.existsSync(MAESTRA_PATH)) {
    console.error("No se encontró maestra en:", MAESTRA_PATH);
    console.error("Indica la ruta al proyecto Mtra. Rosa Isela como argumento.");
    process.exit(1);
  }
  if (!fs.existsSync(MAT_PATH)) {
    console.error("No se encontró resultados de matemáticas en:", MAT_PATH);
    process.exit(1);
  }

  const maestra = JSON.parse(fs.readFileSync(MAESTRA_PATH, "utf8"));
  const matActual = JSON.parse(fs.readFileSync(MAT_PATH, "utf8"));

  // Mapa: keyAlumno -> { porcentaje, nivel, respuestas }
  const mapMat = new Map();
  for (const esc of matActual.escuelas || []) {
    for (const gr of esc.grupos || []) {
      for (const al of gr.alumnos || []) {
        const k = keyAlumno(esc.cct, al.grupo, al.nombre, al.apellido);
        mapMat.set(k, {
          porcentaje: al.porcentaje,
          nivel: al.nivel,
          respuestas: al.respuestas || [],
        });
      }
    }
  }

  const escuelas = [];
  let totalConExamen = 0;
  let totalSinExamen = 0;

  for (const escMaestra of maestra.escuelas || []) {
    const cct = escMaestra.cct;
    let req = 0;
    let des = 0;
    let esp = 0;
    const aciertosEsc = new Array(NUM_REACTIVOS).fill(0);
    const totalesEsc = new Array(NUM_REACTIVOS).fill(0);

    const gruposResumen = (escMaestra.grupos || []).map((grMaestra) => {
      const alumnosGrupo = [];
      let reqG = 0;
      let desG = 0;
      let espG = 0;
      const aciertosG = new Array(NUM_REACTIVOS).fill(0);
      const totalesG = new Array(NUM_REACTIVOS).fill(0);

      for (const al of grMaestra.alumnos || []) {
        const k = keyAlumno(cct, al.grupo, al.nombre, al.apellido);
        const mat = mapMat.get(k);

        if (mat) {
          totalConExamen++;
          alumnosGrupo.push({
            nombre: al.nombre,
            apellido: al.apellido,
            grupo: al.grupo,
            porcentaje: mat.porcentaje,
            nivel: mat.nivel,
            respuestas: mat.respuestas.slice(0, NUM_REACTIVOS),
          });
          if (mat.nivel === "REQUIERE APOYO") req++;
          else if (mat.nivel === "EN DESARROLLO") des++;
          else esp++;
          if (mat.nivel === "REQUIERE APOYO") reqG++;
          else if (mat.nivel === "EN DESARROLLO") desG++;
          else espG++;
          for (let i = 0; i < NUM_REACTIVOS; i++) {
            if (mat.respuestas[i] === "C") {
              aciertosEsc[i]++;
              aciertosG[i]++;
            }
            totalesEsc[i]++;
            totalesG[i]++;
          }
        } else {
          totalSinExamen++;
          alumnosGrupo.push({
            nombre: al.nombre,
            apellido: al.apellido,
            grupo: al.grupo,
            porcentaje: null,
            nivel: "SIN EXAMEN",
            respuestas: [],
          });
        }
      }

      const porcentajesG = aciertosG.map((a, i) =>
        totalesG[i] > 0 ? Math.round((a / totalesG[i]) * 1000) / 10 : 0
      );

      return {
        nombre: grMaestra.nombre,
        alumnos: alumnosGrupo,
        porcentajesReactivos: porcentajesG,
        requiereApoyo: reqG,
        enDesarrollo: desG,
        esperado: espG,
        total: alumnosGrupo.length,
      };
    });

    const porcentajesEsc = aciertosEsc.map((a, i) =>
      totalesEsc[i] > 0 ? Math.round((a / totalesEsc[i]) * 1000) / 10 : 0
    );

    escuelas.push({
      cct,
      totalEstudiantes: escMaestra.totalEstudiantes,
      porcentajesReactivos: porcentajesEsc,
      requiereApoyo: req,
      enDesarrollo: des,
      esperado: esp,
      grupos: gruposResumen,
      buscador: escMaestra.buscador,
    });
  }

  const out = {
    escuelas,
    generado: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");

  console.log("OK: Base unificada guardada en", OUT_PATH);
  console.log("  Escuelas:", escuelas.length);
  console.log("  Total alumnos (maestra):", escuelas.reduce((s, e) => s + e.totalEstudiantes, 0));
  console.log("  Con examen matemáticas:", totalConExamen);
  console.log("  Sin examen matemáticas:", totalSinExamen);
}

main();
