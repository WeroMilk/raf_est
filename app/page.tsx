import Link from "next/link";
import { getResultadosSync } from "@/lib/data-server";
import { COLORS } from "@/types/raf";
import LogoSonoraSec from "@/app/components/LogoSonoraSec";

export default function HomePage() {
  const { escuelas, generado } = getResultadosSync();
  const totalAlumnos = escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
  const totalReq = escuelas.reduce((s, e) => s + e.requiereApoyo, 0);
  const totalDes = escuelas.reduce((s, e) => s + e.enDesarrollo, 0);
  const totalEsp = escuelas.reduce((s, e) => s + e.esperado, 0);
  const pctReq = totalAlumnos ? Math.round((totalReq / totalAlumnos) * 100) : 0;
  const pctDes = totalAlumnos ? Math.round((totalDes / totalAlumnos) * 100) : 0;
  const pctEsp = totalAlumnos ? Math.round((totalEsp / totalAlumnos) * 100) : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden gap-2 animate-fade-in p-2 lg:gap-6 lg:p-0 lg:pb-8">
      <header className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground lg:text-xl lg:tracking-tight">RAF Matemáticas</h1>
          <p className="text-xs text-foreground/80 lg:text-sm">Secundarias Técnicas · SEC Sonora · Hermosillo</p>
        </div>
        <div className="flex justify-end sm:shrink-0">
          <LogoSonoraSec maxWidth={160} className="hidden sm:block" />
          <LogoSonoraSec maxWidth={130} className="sm:hidden" />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2 lg:pb-4" style={{ WebkitOverflowScrolling: "touch" }}>
        {escuelas.length === 0 ? (
          <div className="card-ios rounded-2xl border border-border bg-card p-4 text-center text-sm">
            <p className="text-foreground/80">No hay datos. Coloca *_actualizado.xlsx en data/excel/ y ejecuta npm run build:data</p>
          </div>
        ) : (
          <>
            <section className="grid min-w-0 grid-cols-3 gap-2 lg:gap-4">
              <Link
                href="/por-nivel?nivel=REQUIERE_APOYO"
                className="link-ios group relative card-ios min-w-0 rounded-2xl p-2.5 text-center text-white transition-transform shadow-md lg:p-4"
                style={{ backgroundColor: COLORS.requiereApoyo }}
                title={`${pctReq}%`}
              >
                <div className="text-lg font-bold lg:text-2xl">{totalReq}</div>
                <div className="text-[10px] opacity-95 lg:text-sm">Requieren apoyo</div>
                <span className="absolute inset-x-0 bottom-full mb-1 mx-auto w-fit rounded bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 pointer-events-none">
                  {pctReq}%
                </span>
              </Link>
              <Link
                href="/por-nivel?nivel=EN_DESARROLLO"
                className="link-ios group relative card-ios min-w-0 rounded-2xl p-2.5 text-center text-white transition-transform shadow-md lg:p-4"
                style={{ backgroundColor: COLORS.enDesarrollo }}
                title={`${pctDes}%`}
              >
                <div className="text-lg font-bold lg:text-2xl">{totalDes}</div>
                <div className="text-[10px] opacity-95 lg:text-sm">En desarrollo</div>
                <span className="absolute inset-x-0 bottom-full mb-1 mx-auto w-fit rounded bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 pointer-events-none">
                  {pctDes}%
                </span>
              </Link>
              <Link
                href="/por-nivel?nivel=ESPERADO"
                className="link-ios group relative card-ios min-w-0 rounded-2xl p-2.5 text-center text-white transition-transform shadow-md lg:p-4"
                style={{ backgroundColor: COLORS.esperado }}
                title={`${pctEsp}%`}
              >
                <div className="text-lg font-bold lg:text-2xl">{totalEsp}</div>
                <div className="text-[10px] opacity-95 lg:text-sm">Esperado</div>
                <span className="absolute inset-x-0 bottom-full mb-1 mx-auto w-fit rounded bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 pointer-events-none">
                  {pctEsp}%
                </span>
              </Link>
            </section>

            <section className="card-ios rounded-2xl border border-border bg-card p-3 lg:p-4">
              <p className="text-sm font-semibold lg:text-base">{totalAlumnos} Alumnos Evaluados · {escuelas.length} Escuelas Secundarias Técnicas · Primer Grado</p>
            </section>

            <section className="grid gap-2 lg:grid-cols-2 lg:gap-4">
              <Link
                href="/escuelas"
                className="link-ios card-ios flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium lg:px-5 lg:py-4 lg:text-base"
              >
                Ver por escuela <span className="text-foreground/60">→</span>
              </Link>
              <Link
                href="/por-nivel"
                className="link-ios card-ios flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium lg:px-5 lg:py-4 lg:text-base"
              >
                Ver por nivel <span className="text-foreground/60">→</span>
              </Link>
            </section>

            <p className="mt-1 shrink-0 text-[10px] text-foreground/50">
              Última Actualización {new Date(generado).toLocaleString("es-MX")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
