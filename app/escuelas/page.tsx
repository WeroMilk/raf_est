import BackButton from "@/app/components/BackButton";
import PageHeader from "@/app/components/PageHeader";
import ScrollOnlyWhenNeeded from "@/app/components/ScrollOnlyWhenNeeded";
import EscuelasContent from "./EscuelasContent";
import { getEscuelasSync } from "@/lib/data-server";

export default function EscuelasPage() {
  const escuelas = getEscuelasSync();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-2">
      <PageHeader>
        <BackButton href="/" label="Inicio" />
        <h1 className="mt-0.5 text-base font-bold">Por escuela</h1>
        <p className="text-xs text-foreground/80">Selecciona una escuela.</p>
      </PageHeader>

      {escuelas.length === 0 ? (
        <p className="text-xs text-foreground/60">No hay escuelas cargadas.</p>
      ) : (
        <ScrollOnlyWhenNeeded className="min-h-0 flex-1 overflow-x-hidden">
          <EscuelasContent escuelas={escuelas} />
        </ScrollOnlyWhenNeeded>
      )}
    </div>
  );
}
