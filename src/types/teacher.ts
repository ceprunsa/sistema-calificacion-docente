export type CourseType =
  | "biología"
  | "cívica"
  | "filosofía"
  | "física"
  | "geografía"
  | "historia"
  | "ingles"
  | "lenguaje"
  | "literatura"
  | "matemática"
  | "psicología"
  | "química"
  | "razonamiento lógico"
  | "razonamiento matemático"
  | "razonamiento verbal";

export type WorkConditionType =
  | "tiempo completo"
  | "tiempo parcial"
  | "no trabaja en otra institución";

export interface ShiftHours {
  [key: string]: number; // Ejemplo: "turno 1": 10, "turno 2": 4
}

export interface Teacher {
  id: string;
  dni: string; // 8 a 10 dígitos
  apellidos: string;
  nombres: string;
  telefono: string;
  correoPersonal: string;
  correoInstitucional: string;
  curso: CourseType;
  condicionInstitucional: WorkConditionType;
  horasPorTurno: ShiftHours;
  totalHoras: number;
  createdAt: string;
  updatedAt: string;
}

// Modificamos TeacherFormData para que pueda incluir opcionalmente un ID
export interface TeacherFormData {
  id?: string;
  dni: string;
  apellidos: string;
  nombres: string;
  telefono: string;
  correoPersonal: string;
  correoInstitucional: string;
  curso: CourseType;
  condicionInstitucional: WorkConditionType;
  horasPorTurno: ShiftHours;
}
