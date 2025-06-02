export type PerformanceLevel = "I" | "II" | "III" | "IV";

export interface TeacherEvaluation {
  id: string;
  teacherId: string;
  evaluatorId: string;
  evaluatorName: string;
  date: string;
  time: string; // Nueva: hora de la evaluación
  reflectiveDialogueDate: string | null;
  reflectiveDialogueTime: string | null; // Nueva: hora del diálogo reflexivo
  evidenceImageUrl: string | null; // Nueva: URL de la imagen de evidencia
  evidenceImageBase64?: string | null; // Nueva: imagen en base64 para exportación

  // Los 6 desempeños evaluados
  performance1: PerformanceLevel; // Involucra activamente a los estudiantes
  performance2: PerformanceLevel; // Promueve el razonamiento, creatividad y pensamiento crítico
  performance3: PerformanceLevel; // Evalúa el progreso de los aprendizajes
  performance4: PerformanceLevel; // Propicia un ambiente de respeto y proximidad
  performance5: PerformanceLevel; // Regula positivamente el comportamiento
  performance6: PerformanceLevel; // Uso de ayudas tecnológicas

  // Comentarios adicionales
  observations: string;
  strengths: string;
  improvementAreas: string;
  commitments: string;

  createdAt: string;
  updatedAt: string;
}

export interface EvaluationFormData
  extends Omit<TeacherEvaluation, "id" | "createdAt" | "updatedAt"> {
  id?: string;
  evidenceImage?: File | null; // Para el archivo de imagen en el formulario
}

// Descripciones de los niveles para cada desempeño
export const performanceDescriptions = {
  performance1: {
    I: "El docente ofrece muy poca oportunidad de participación del estudiante, dictando solo las diapositivas.",
    II: "El docente explica las diapositivas resaltando con un lápiz digital, involucrando a los estudiantes a través del chat",
    III: "El docente involucra a la gran mayoría de los estudiantes en el aprendizaje y expone con ayudas gráficas, las diapositivas.",
    IV: "El docente involucra activamente a casi todos los estudiantes, preguntando personalizadamente, al azar. Expone con ayuda de graficadores, las diapositivas.",
  },
  performance2: {
    I: "El docente propone actividades o establece interacciones que estimulan únicamente el aprendizaje reproductivo memorístico.",
    II: "El docente intenta promover el razonamiento, la creatividad y/o el pensamiento crítico al menos en una ocasión, pero no lo logra.",
    III: "El docente promueve efectivamente el razonamiento, la creatividad y/o el pensamiento crítico al menos en una ocasión.",
    IV: "El docente promueve efectivamente el razonamiento, la creatividad y/o el pensamiento crítico en la sesión, en su conjunto.",
  },
  performance3: {
    I: "El docente no monitorea, o ante las respuestas de los estudiantes, el docente da retroalimentación incorrecta o no da retroalimentación.",
    II: "El docente monitorea activamente a los estudiantes, pero solo les brinda retroalimentación elemental.",
    III: "El docente monitorea activamente a los estudiantes, y les brinda retroalimentación descriptiva.",
    IV: "El docente monitorea activamente a los estudiantes y les brinda -al menos en una ocasión, en la sesión, retroalimentación por descubrimiento o reflexión.",
  },
  performance4: {
    I: "Si hay faltas de respeto entre los estudiantes, el docente no interviene (o ignora el hecho). O el docente, en alguna ocasión, falta el respeto a uno o más estudiantes.",
    II: "El docente es siempre respetuoso con los estudiantes, aunque frío o distante. Además, interviene si nota faltas de respeto al docente.",
    III: "El docente es siempre respetuoso con los estudiantes, es cordial y les transmite calidez. Siempre se muestra empático con sus necesidades.",
    IV: "El docente es siempre respetuoso con los estudiantes y muestra consideración hacia sus perspectivas. Es cordial con ellos y les transmite calidez. Siempre es empático.",
  },
  performance5: {
    I: "Para prevenir o controlar el comportamiento inapropiado en el aula, el docente utiliza predominantemente mecanismos de control externo -negativos.",
    II: "El docente utiliza predominantemente mecanismos formativos y nunca de maltrato para regular el comportamiento de los estudiantes, pero es poco eficaz.",
    III: "El docente utiliza predominantemente mecanismos formativos -positivos- y nunca de maltrato para regular el comportamiento de los estudiantes de manera eficaz.",
    IV: "El docente siempre utiliza mecanismos formativos -positivos- para regular el comportamiento de los estudiantes de manera eficaz.",
  },
  performance6: {
    I: "El docente no añade tecnologías o muros de interacción con sus estudiantes, no permitiendo de esta manera la participación de sus estudiantes.",
    II: "El docente utiliza al menos alguna tecnología como muros Padlet, en una ocación, para interactuar con sus estudiantes a través de la virtualidad.",
    III: "El docente trabaja con pizarras interactivas para permitir la mayor participación de estudiantes, usando los muros de interacción Padlet, al menos más de una ocación.",
    IV: "El docente siempre utiliza pizarras interactivas y hace que sus estudiantes constantemente envíen respuestas a través de muros de participación cuando les pregunta.",
  },
};

// Títulos de los desempeños
export const performanceTitles = {
  performance1:
    "Involucra activamente a los estudiantes en el proceso de aprendizaje",
  performance2:
    "Promueve el razonamiento, la creatividad y/o el pensamiento crítico",
  performance3: "Evalúa el progreso de los aprendizajes para retroalimentar",
  performance4: "Propicia un ambiente de respeto y proximidad",
  performance5: "Regula positivamente el comportamiento de los estudiantes",
  performance6: "Uso de ayudas tecnológicas para la enseñanza aprendizaje",
};

// Descripción general de los niveles
export const levelDescriptions = {
  I: "No alcanzan a demostrar los aspectos mínimos del desempeño.",
  II: "Se observa tanto logros como oportunidades de mejora que caracterizan al docente en este nivel.",
  III: "Se observa la mayoría de conductas deseadas en el desempeño del docente.",
  IV: "Se observa todas las conductas deseadas en el desempeño del docente.",
};
