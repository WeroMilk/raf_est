import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getEscuelaSync } from "@/lib/data-server";
import { getSession } from "@/lib/auth";
import { COLORS } from "@/types/raf";
import ChartBarrasReactivos from "@/app/components/ChartBarrasReactivos";
import ChartPastelNiveles from "@/app/components/ChartPastelNiveles";
import BackButton from "@/app/components/BackButton";
import LogoutButton from "@/app/components/LogoutButton";
import LogoSonoraSec from "@/app/components/LogoSonoraSec";
import ScrollOnlyWhenNeeded from "@/app/components/ScrollOnlyWhenNeeded";

export default async function EscuelaPage({ params }: { params: Promise<{ cct: string }> }) {
  const { cct } = await params;
  const escuela = getEscuelaSync(cct);
  if (!escuela) notFound();

  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("raf_session")?.value ?? null);
  const isSuper = session?.tipo === "super";

  const total = escuela.totalEstudiantes;
  const pctApoyo = total ? Math.round((escuela.requiereApoyo / total) * 100) : 0;
  const pctDes = total ? Math.round((escuela.enDesarrollo / total) * 100) : 0;
  const pctEsp = total ? Math.round((escuela.esperado / total) * 100) : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-2 min-w-0 lg:gap-6 lg:p-0 lg:pb-8">
      <header className="shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {isSuper && <BackButton href="/escuelas" label="Escuelas" />}
            <LogoutButton />
          </div>
          <div className="shrink-0">
            <LogoSonoraSec maxWidth={160} className="hidden sm:block" />
            <LogoSonoraSec maxWidth={130} className="sm:hidden" />
          </div>
        </div>
        <h1 className="mt-1 text-base font-bold lg:text-xl lg:tracking-tight">
          {escuela.buscador?.nombre ?? escuela.cct}
        </h1>
        <p className="text-xs text-foreground/80 lg:text-sm">
          {escuela.cct}
          {escuela.buscador?.localidad || escuela.buscador?.municipio
            ? ` · ${[escuela.buscador.localidad, escuela.buscador.municipio].filter(Boolean).join(", ")}`
            : ""}
        </p>
        <p className="text-xs text-foreground/70 lg:text-sm">
          {escuela.totalEstudiantes} alumnos · {escuela.grupos.length} grupos
        </p>
        {(escuela.buscador?.domicilio || escuela.buscador?.telefono) && (
          <p className="mt-0.5 text-[11px] text-foreground/60 lg:text-xs">
            {[escuela.buscador.domicilio, escuela.buscador.telefono].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>

      <section className="grid min-w-0 grid-cols-3 gap-2 lg:gap-4 shrink-0">
        <Link
          href="/por-nivel?nivel=REQUIERE_APOYO"
          className="link-ios group relative card-ios min-w-0 rounded-2xl p-2 text-center text-white transition-transform outline-none lg:p-4"
          style={{ backgroundColor: COLORS.requiereApoyo }}
          title={`${pctApoyo}%`}
        >
          <div className="text-sm font-bold lg:text-2xl">{escuela.requiereApoyo}</div>
          <div className="text-[10px] opacity-90 lg:text-sm">Apoyo</div>
          <span className="absolute inset-x-0 bottom-full mb-1 mx-auto w-fit rounded bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 pointer-events-none">
            {pctApoyo}%
          </span>
        </Link>
        <Link
          href="/por-nivel?nivel=EN_DESARROLLO"
          className="link-ios group relative card-ios min-w-0 rounded-2xl p-2 text-center text-white transition-transform outline-none lg:p-4"
          style={{ backgroundColor: COLORS.enDesarrollo }}
          title={`${pctDes}%`}
        >
          <div className="text-sm font-bold lg:text-2xl">{escuela.enDesarrollo}</div>
          <div className="text-[10px] opacity-90 lg:text-sm">Desarrollo</div>
          <span className="absolute inset-x-0 bottom-full mb-1 mx-auto w-fit rounded bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 pointer-events-none">
            {pctDes}%
          </span>
        </Link>
        <Link
          href="/por-nivel?nivel=ESPERADO"
          className="link-ios group relative card-ios min-w-0 rounded-2xl p-2 text-center text-white transition-transform outline-none lg:p-4"
          style={{ backgroundColor: COLORS.esperado }}
          title={`${pctEsp}%`}
        >
          <div className="text-sm font-bold lg:text-2xl">{escuela.esperado}</div>
          <div className="text-[10px] opacity-90 lg:text-sm">Esperado</div>
          <span className="absolute inset-x-0 bottom-full mb-1 mx-auto w-fit rounded bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 pointer-events-none">
            {pctEsp}%
          </span>
        </Link>
      </section>

      <section className="grid shrink-0 gap-3 lg:grid-cols-2 lg:gap-6">
        <section className="card-ios rounded-2xl border border-border bg-card p-3 lg:p-5">
          <ChartBarrasReactivos
            porcentajes={escuela.porcentajesReactivos}
            totalAlumnos={escuela.totalEstudiantes}
            title="Aciertos por reactivo"
          />
        </section>
        <section className="card-ios rounded-2xl border border-border bg-card p-3 lg:p-5">
          <ChartPastelNiveles
            requiereApoyo={escuela.requiereApoyo}
            enDesarrollo={escuela.enDesarrollo}
            esperado={escuela.esperado}
            title="Por nivel"
          />
        </section>
      </section>

      <ScrollOnlyWhenNeeded className="min-h-0 flex-1 overflow-x-hidden min-w-0 pb-8">
        <h2 className="mb-2 text-xs font-semibold lg:text-sm lg:mb-3 shrink-0">Grupos</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 content-start lg:gap-3">
          {escuela.grupos.map((g) => (
            <li key={g.nombre} className="min-w-0">
              <Link
                href={`/escuela/${escuela.cct}/grupo/${encodeURIComponent(g.nombre)}`}
                className="link-ios card-ios flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 text-center lg:p-3 lg:rounded-2xl"
              >
                <span className="truncate w-full text-xs font-semibold leading-tight lg:text-sm">{g.nombre}</span>
                <span className="mt-1 text-[10px] text-foreground/70 lg:text-xs">{g.total} · Apoyo: {g.requiereApoyo}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollOnlyWhenNeeded>
    </div>
  );
}
