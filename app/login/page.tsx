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
      className="flex min-h-dvh w-full max-w-full flex-col items-center justify-center px-4"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex justify-center ml-5">
          <LogoSonoraSec maxWidth={200} priority />
        </div>
        <h1 className="text-lg font-bold text-foreground">RAF Matemáticas</h1>
        <p className="text-sm text-foreground/70">Ingresa la contraseña de tu E.S.T.</p>
        <form
          action="/api/login"
          method="POST"
          className="mt-2 w-full flex flex-col gap-4"
          onSubmit={(e) => {
            setLoading(true);
            const input = e.currentTarget.querySelector<HTMLInputElement>('input[name="password"]');
            if (input) input.value = input.value.trim().replace(/\s+/g, "");
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
            className="card-ios w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="link-ios w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-auto pt-6 text-xs text-foreground/50">Mtra. Marta Camargo</p>
      </div>
    </div>
  );
}
