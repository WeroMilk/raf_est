/**
 * Corrige texto que fue guardado en UTF-8 pero leído como Latin-1 (mojibake).
 * Ej.: "PEÃA" → "PEÑA", "Ã³" → "ó", "MUÃOZ" → "MUÑOZ".
 */
export function fixUtf8Mojibake(str: string): string {
  if (typeof str !== "string") return str;
  // Casos donde Ñ/ñ se guardó como Ã + A/O/± etc. (segundo byte de UTF-8 Ñ interpretado como otro carácter)
  let s = str
    .replace(/Ã±/g, "ñ")
    .replace(/ÃA/g, "Ñ")
    .replace(/ÃO/g, "Ñ")
    .replace(/Ãa/g, "ñ")
    .replace(/Ão/g, "ñ");
  if (s !== str) return s;
  // Mojibake estándar: secuencia UTF-8 leída como Latin-1
  if (!/Ã[\x80-\xBF]/.test(str)) return str;
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

/**
 * Recorre un objeto y aplica fixUtf8Mojibake a todas las cadenas.
 * Útil para corregir resultados.json generado con codificación incorrecta.
 */
export function fixObjectStrings<T>(obj: T): T {
  if (typeof obj === "string") return fixUtf8Mojibake(obj) as T;
  if (obj == null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => fixObjectStrings(item)) as T;
  const out = {} as T;
  for (const [k, v] of Object.entries(obj)) {
    (out as Record<string, unknown>)[k] = fixObjectStrings(v);
  }
  return out;
}
