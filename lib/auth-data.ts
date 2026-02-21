import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

type AuthData = { superUsuario: string; escuelas: Record<string, string> };

function trimEnv(value: string | undefined): string {
  const s = (value ?? "").trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

function load(): AuthData {
  // En producción (Vercel) define AUTH_SUPER_HASH o AUTH_SUPER_PASSWORD si el archivo no se lee
  const envSuperHash = trimEnv(process.env.AUTH_SUPER_HASH) || "";
  const filePath = path.join(process.cwd(), "lib", "auth-data.json");
  try {
    let raw = fs.readFileSync(filePath, "utf8");
    raw = raw.replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rawSuper =
      typeof parsed["superUsuario"] === "string"
        ? parsed["superUsuario"]
        : typeof parsed["super"] === "string"
          ? parsed["super"]
          : (() => {
              const key = Object.keys(parsed).find((k) => k.replace(/\uFEFF/g, "") === "superUsuario" || k.replace(/\uFEFF/g, "") === "super");
              return key && typeof parsed[key] === "string" ? (parsed[key] as string) : "";
            })();
    const fileSuperHash = typeof rawSuper === "string" ? rawSuper.trim() : "";
    const escuelas =
      parsed["escuelas"] && typeof parsed["escuelas"] === "object" && !Array.isArray(parsed["escuelas"])
        ? (parsed["escuelas"] as Record<string, string>)
        : {};
    const superHash = envSuperHash || fileSuperHash;
    return { superUsuario: superHash, escuelas };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth-data] Error leyendo", filePath, err);
    }
    return { superUsuario: envSuperHash, escuelas: {} };
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password, "utf8").digest("hex");
}

function normalizePasswordForVerify(password: string): string {
  return String(password ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

export function verifyPassword(password: string): { tipo: "super" | "escuela"; cct?: string } | null {
  const normalized = normalizePasswordForVerify(password);
  if (!normalized) return null;
  const envSuperPassword = trimEnv(process.env.AUTH_SUPER_PASSWORD);
  if (envSuperPassword && normalized === normalizePasswordForVerify(envSuperPassword)) {
    return { tipo: "super" };
  }
  const data = load();
  const hash = hashPassword(normalized);
  const superHash = (data.superUsuario || "").trim();
  if (superHash && hash === superHash) return { tipo: "super" };
  for (const [cct, h] of Object.entries(data.escuelas)) {
    if (h != null && String(h).trim() === hash) return { tipo: "escuela", cct };
  }
  return null;
}
