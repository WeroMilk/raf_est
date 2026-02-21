/**
 * Corrige texto que fue guardado en UTF-8 pero leído como Latin-1 (mojibake).
 * Ej.: "PEÃA" → "PEÑA", "Ã³" → "ó".
 */
export function fixUtf8Mojibake(str: string): string {
  if (typeof str !== "string") return str;
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
