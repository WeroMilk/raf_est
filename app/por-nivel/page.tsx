import { cookies } from "next/headers";
import BackButton from "@/app/components/BackButton";
import PageHeader from "@/app/components/PageHeader";
import PorNivelContent from "./PorNivelContent";
import { getResultadosSync } from "@/lib/data-server";
import { getAlumnosPorNivelSync } from "@/lib/data-server";
import { getSession } from "@/lib/auth";
import type { NivelRAF } from "@/types/raf";
import { NIVELES } from "@/types/raf";

const PARAM_TO_NIVEL: Record<string, NivelRAF> = {
  REQUIERE_APOYO: "REQUIERE APOYO",
  EN_DESARROLLO: "EN DESARROLLO",
  ESPERADO: "ESPERADO",
};

function filterByCct<T extends { cct: string }>(arr: T[], cct: string): T[] {
  return arr.filter((x) => x.cct === cct);
}

export default async function PorNivelPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; grupo?: string }>;
}) {
  const params = await searchParams;
  const nivelParam = params.nivel ?? "";
  const nivelFiltro: NivelRAF | null = PARAM_TO_NIVEL[nivelParam] ?? null;
  const grupoParam = params.grupo ?? "";

  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("raf_session")?.value ?? null);

  let { escuelas } = getResultadosSync();
  let alumnosPorNivel = {
    "REQUIERE APOYO": getAlumnosPorNivelSync("REQUIERE APOYO"),
    "EN DESARROLLO": getAlumnosPorNivelSync("EN DESARROLLO"),
    ESPERADO: getAlumnosPorNivelSync("ESPERADO"),
  } as Record<NivelRAF, { alumno: { nombre: string; apellido: string; grupo: string; porcentaje: number; nivel: NivelRAF }; cct: string }[]>;

  if (session?.tipo === "escuela" && session.cct) {
    escuelas = escuelas.filter((e) => e.cct === session.cct);
    for (const nivel of NIVELES) {
      alumnosPorNivel[nivel] = filterByCct(alumnosPorNivel[nivel], session.cct);
    }
  }

  const gruposOptions = escuelas.flatMap((e) =>
    e.grupos.map((g) => ({
      cct: e.cct,
      grupo: g.nombre,
      label: `${e.cct} - ${g.nombre}`,
    }))
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0.5 overflow-hidden p-2 pb-2">
      <PageHeader>
        <BackButton
          href={nivelFiltro ? "/por-nivel" : "/"}
          label={nivelFiltro ? "Por nivel" : "Inicio"}
        />
      </PageHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PorNivelContent
        alumnosPorNivel={alumnosPorNivel}
        escuelas={escuelas.map((e) => ({ cct: e.cct }))}
        gruposOptions={gruposOptions}
        nivelFiltro={nivelFiltro}
        soloCct={session?.tipo === "escuela" ? session.cct : undefined}
        initialGrupo={grupoParam}
      />
      </div>
    </div>
  );
}
