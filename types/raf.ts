export type NivelRAF = "REQUIERE APOYO" | "EN DESARROLLO" | "ESPERADO" | "SIN EXAMEN";

export const NIVELES: NivelRAF[] = [
  "REQUIERE APOYO",
  "EN DESARROLLO",
  "ESPERADO",
  "SIN EXAMEN",
];

/** Solo niveles con examen (para vista Por nivel) */
export const NIVELES_CON_EXAMEN: NivelRAF[] = [
  "REQUIERE APOYO",
  "EN DESARROLLO",
  "ESPERADO",
];

export const COLORS = {
  requiereApoyo: "#D32F2F",
  enDesarrollo: "#F9A825",
  esperado: "#2E7D32",
  sinExamen: "#757575",
  header: "#4472C4",
} as const;

export const NIVEL_COLOR: Record<NivelRAF, string> = {
  "REQUIERE APOYO": COLORS.requiereApoyo,
  "EN DESARROLLO": COLORS.enDesarrollo,
  ESPERADO: COLORS.esperado,
  "SIN EXAMEN": COLORS.sinExamen,
};

export interface AlumnoRAF {
  nombre: string;
  apellido: string;
  grupo: string;
  porcentaje: number | null;
  nivel: NivelRAF;
  respuestas: string[];
}

export interface GrupoResumen {
  nombre: string;
  alumnos: AlumnoRAF[];
  porcentajesReactivos: number[];
  requiereApoyo: number;
  enDesarrollo: number;
  esperado: number;
  total: number;
}

/** Datos opcionales del Buscador de Escuelas en Línea (SEP) para personalizar la ficha */
export interface EscuelaInfoBuscador {
  nombre?: string;
  turno?: string;
  nivelEducativo?: string;
  zona?: string;
  domicilio?: string;
  telefono?: string;
  colonia?: string;
  localidad?: string;
  municipio?: string;
}

export interface EscuelaResumen {
  cct: string;
  totalEstudiantes: number;
  porcentajesReactivos: number[];
  requiereApoyo: number;
  enDesarrollo: number;
  esperado: number;
  grupos: GrupoResumen[];
  /** Datos del Buscador de Escuelas (nombre, domicilio, etc.) si se fusionaron */
  buscador?: EscuelaInfoBuscador;
}

export interface ResultadosRAF {
  escuelas: EscuelaResumen[];
  generado: string;
}
