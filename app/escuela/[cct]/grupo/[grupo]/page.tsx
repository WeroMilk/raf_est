import Link from "next/link";
import { notFound } from "next/navigation";
import { getEscuelaSync } from "@/lib/data-server";
import { NIVEL_COLOR } from "@/types/raf";
import ChartBarrasReactivos from "@/app/components/ChartBarrasReactivos";
import ChartPastelNiveles from "@/app/components/ChartPastelNiveles";
import TablaAlumnos from "@/app/components/TablaAlumnos";
import BackButton from "@/app/components/BackButton";
import ScrollOnlyWhenNeeded from "@/app/components/ScrollOnlyWhenNeeded";

const NIVEL_TO_PARAM = {
  "REQUIERE APOYO": "REQUIERE_APOYO",
  "EN DESARROLLO": "EN_DESARROLLO",
  ESPERADO: "ESPERADO",
} as const;

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ cct: string; grupo: string }>;
}) {
  const { cct, grupo } = await params;
  const grupoDecoded = decodeURIComponent(grupo);
  const escuela = getEscuelaSync(cct);
  if (!escuela) notFound();
  const grupoData = escuela.grupos.find((g) => g.nombre === grupoDecoded);
  if (!grupoData) notFound();

  const total = grupoData.total;
  const pctApoyo = total ? Math.round((grupoData.requiereApoyo / total) * 100) : 0;
  const pctDes = total ? Math.round((grupoData.enDesarrollo / total) * 100) : 0;
  const pctEsp = total ? Math.round((grupoData.esperado / total) * 100) : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 min-w-0">
      <header className="shrink-0">
        <BackButton href={`/escuela/${cct}`} label={escuela.cct} />
        <h1 className="mt-1 text-base font-bold">Grupo {grupoData.nombre}</h1>
        <p className="text-xs text-foreground/80">{grupoData.total} alumnos</p>
      </header>

      <ScrollOnlyWhenNeeded className="min-h-0 flex-1 overflow-x-hidden flex flex-col gap-2 pb-4">
      <section className="grid min-w-0 grid-cols-3 gap-2 shrink-0">
        <Link
          href={`/por-nivel?nivel=${NIVEL_TO_PARAM["REQUIERE APOYO"]}&grupo=${encodeURIComponent(`${cct}|${grupoDecoded}`)}`}
          className="group relative card-ios min-w-0 rounded-2xl p-2 text-center text-white transition-transform outline-none"
          style={{ backgroundColor: NIVEL_COLOR["REQUIERE APOYO"] }}
          title={`${pctApoyo}%`}
        >
          <div className="text-sm font-bold">{grupoData.requiereApoyo}</div>
          <div className="text-[10px] opacity-90">Apoyo</div>
          <span className="absolute inset-x-0 bottom-full mb-1 mx-auto w-fit rounded bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 pointer-events-none">
            {pctApoyo}%
          </span>
        </Link>
        <Link
          href={`/por-nivel?nivel=${NIVEL_TO_PARAM["EN DESARROLLO"]}&grupo=${encodeURIComponent(`${cct}|${grupoDecoded}`)}`}
          className="group relative card-ios min-w-0 rounded-2xl p-2 text-center text-white transition-transform outline-none"
          style={{ backgroundColor: NIVEL_COLOR["EN DESARROLLO"] }}
          title={`${pctDes}%`}
        >
          <div className="text-sm font-bold">{grupoData.enDesarrollo}</div>
          <div className="text-[10px] opacity-90">Desarrollo</div>
          <span className="absolute inset-x-0 bottom-full mb-1 mx-auto w-fit rounded bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 pointer-events-none">
            {pctDes}%
          </span>
        </Link>
        <Link
          href={`/por-nivel?nivel=${NIVEL_TO_PARAM["ESPERADO"]}&grupo=${encodeURIComponent(`${cct}|${grupoDecoded}`)}`}
          className="group relative card-ios min-w-0 rounded-2xl p-2 text-center text-white transition-transform outline-none"
          style={{ backgroundColor: NIVEL_COLOR["ESPERADO"] }}
          title={`${pctEsp}%`}
        >
          <div className="text-sm font-bold">{grupoData.esperado}</div>
          <div className="text-[10px] opacity-90">Esperado</div>
          <span className="absolute inset-x-0 bottom-full mb-1 mx-auto w-fit rounded bg-black/85 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 pointer-events-none">
            {pctEsp}%
          </span>
        </Link>
      </section>

      <section className="card-ios shrink-0 rounded-2xl border border-border bg-card p-3">
        <ChartBarrasReactivos
          porcentajes={grupoData.porcentajesReactivos}
          totalAlumnos={grupoData.total}
          title="Aciertos por reactivo"
        />
      </section>
      <section className="card-ios shrink-0 rounded-2xl border border-border bg-card p-3">
        <ChartPastelNiveles
          requiereApoyo={grupoData.requiereApoyo}
          enDesarrollo={grupoData.enDesarrollo}
          esperado={grupoData.esperado}
          title="Por nivel"
        />
      </section>

      <section className="min-w-0 shrink-0">
        <h2 className="mb-2 text-xs font-semibold">Alumnos</h2>
        <TablaAlumnos alumnos={grupoData.alumnos} />
      </section>
      </ScrollOnlyWhenNeeded>
    </div>
  );
}
