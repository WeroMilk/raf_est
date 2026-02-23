"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import LogoSonoraSec from "@/app/components/LogoSonoraSec";

const ERROR_MESSAGES: Record<string, string> = {
  empty: "Campo requerido",
  invalid: "Contraseña incorrecta",
  server: "Error al iniciar sesión. Intenta de nuevo.",
  auth_secret_required:
    "La app no está configurada en el servidor. El administrador debe añadir AUTH_SECRET en Vercel (Variables de entorno).",
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const errorMsg = searchParams.get("msg");
  const [error, setError] = useState("");

  useEffect(() => {
    if (errorCode) {
      const decoded = errorMsg ? decodeURIComponent(errorMsg) : "";
      setError((ERROR_MESSAGES[decoded] ?? ERROR_MESSAGES[errorCode] ?? decoded) || "Error");
    }
  }, [errorCode, errorMsg]);

  return (
    <div
      className="flex min-h-dvh w-full max-w-full flex-col items-center justify-start px-6 py-8"
      style={{
        paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
        paddingRight: "max(1.5rem, env(safe-area-inset-right))",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-8 text-center">
        <div className="flex justify-center pt-2 ml-6">
          <LogoSonoraSec maxWidth={420} priority />
        </div>
        <div className="mt-12 flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">RAF Matemáticas</h1>
          <p className="text-sm text-foreground/70">Ingresa la contraseña de tu E.S.T.</p>
        </div>
        <form
          action="/api/login"
          method="POST"
          className="w-full flex flex-col gap-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.querySelector<HTMLInputElement>('input[name="password"]');
            const password = input
              ? input.value.trim().replace(/\s+/g, "").replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
              : "";
            if (!password) {
              setError(ERROR_MESSAGES.empty);
              return;
            }
            setLoading(true);
            setError("");
            try {
              const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ password }),
                credentials: "include",
              });
              const data = (await res.json()) as { ok?: boolean; redirect?: string; error?: string; msg?: string };
              if (data.ok && data.redirect) {
                window.location.href = data.redirect;
                return;
              }
              const err = data.msg ?? data.error ?? "invalid";
              setError(ERROR_MESSAGES[err] ?? ERROR_MESSAGES[err as keyof typeof ERROR_MESSAGES] ?? String(err));
            } catch {
              setError(ERROR_MESSAGES.server);
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="sr-only" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            autoFocus
            required
            readOnly={loading}
            className="card-ios w-full rounded-xl border border-border bg-card px-4 py-3.5 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="link-ios w-full rounded-xl bg-primary py-3.5 font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-auto pt-10 text-xs text-foreground/50">Mtra. Marta Camargo</p>
      </div>
    </div>
  );
}
