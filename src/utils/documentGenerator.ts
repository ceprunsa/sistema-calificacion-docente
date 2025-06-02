import { saveAs } from "file-saver";
import type { TeacherEvaluation } from "../types/evaluation";
import type { Teacher } from "../types/teacher";
import {
  performanceTitles,
  performanceDescriptions,
} from "../types/evaluation";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageBreak,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  SectionType,
  convertInchesToTwip,
} from "docx";

// Función para obtener la descripción del nivel de desempeño
const getPerformanceDescription = (
  performance: string,
  level: string
): string => {
  const descriptions =
    performanceDescriptions[
      performance as keyof typeof performanceDescriptions
    ];
  return descriptions[level as keyof typeof descriptions] || "";
};

// Función para obtener el color según el nivel de desempeño
const getPerformanceLevelColor = (level: string): string => {
  switch (level) {
    case "IV":
      return "2E7D32"; // Verde oscuro - Destacado
    case "III":
      return "1976D2"; // Azul - Satisfactorio
    case "II":
      return "F57C00"; // Naranja - En proceso
    case "I":
      return "D32F2F"; // Rojo - Inicio
    default:
      return "757575"; // Gris por defecto
  }
};

// Función para calcular el promedio de desempeño
const calculateAveragePerformance = (evaluation: TeacherEvaluation): number => {
  const levels = [
    evaluation.performance1,
    evaluation.performance2,
    evaluation.performance3,
    evaluation.performance4,
    evaluation.performance5,
    evaluation.performance6,
  ];

  const levelValues = levels.map((level) => {
    switch (level) {
      case "I":
        return 1;
      case "II":
        return 2;
      case "III":
        return 3;
      case "IV":
        return 4;
      default:
        return 0;
    }
  });

  return (
    levelValues.reduce<number>((sum, value) => sum + value, 0) /
    levelValues.length
  );
};

// Función para obtener el nivel promedio como texto
const getAverageLevelText = (average: number): string => {
  if (average >= 3.5) return "IV - Destacado";
  if (average >= 2.5) return "III - Satisfactorio";
  if (average >= 1.5) return "II - En proceso";
  return "I - Inicio";
};

// Función para formatear fecha
const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  return new Date(dateString + "T00:00:00").toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Función para formatear fecha y hora
const formatDateTime = (dateString: string, timeString?: string): string => {
  const formattedDate = formatDate(dateString);
  if (timeString) {
    return `${formattedDate} a las ${timeString}`;
  }
  return formattedDate;
};

// Función para convertir base64 a Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  try {
    // Remover el prefijo data:image/...;base64, si existe
    const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("Error al convertir base64 a Uint8Array:", error);
    throw new Error("Error al procesar la imagen");
  }
};

// Función para crear el encabezado del documento con marca de agua
const createDocumentHeader = async () => {
  try {
    return new Header({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "CEPRUNSA - UNSA",
              bold: true,
              size: 20,
              color: "1565C0",
            }),
            new TextRun({
              text: " | ",
              size: 20,
              color: "666666",
            }),
            new TextRun({
              text: "Sistema de Evaluación Docente",
              size: 18,
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "_______________________________________________________________________________",
              color: "1565C0",
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  } catch (error) {
    console.error("Error al crear encabezado con logo:", error);
    // Fallback sin logo
    return new Header({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "CEPRUNSA - UNSA",
              bold: true,
              size: 20,
              color: "1565C0",
            }),
            new TextRun({
              text: " | ",
              size: 20,
              color: "666666",
            }),
            new TextRun({
              text: "Sistema de Evaluación Docente",
              size: 18,
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "_______________________________________________________________________________",
              color: "1565C0",
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  }
};

// Función para crear el pie de página del documento
const createDocumentFooter = () => {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: "_______________________________________________________________________________",
            color: "1565C0",
            size: 16,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Centro de Estudios Preuniversitarios - Universidad Nacional de San Agustín",
            size: 16,
            color: "666666",
          }),
          new TextRun({
            text: " | Página ",
            size: 16,
            color: "666666",
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 16,
            color: "666666",
          }),
          new TextRun({
            text: " de ",
            size: 16,
            color: "666666",
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 16,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
    ],
  });
};

export const generateEvaluationDocument = async (
  teacher: Teacher,
  evaluation: TeacherEvaluation
): Promise<void> => {
  try {
    console.log("Iniciando generación de documento...");

    // Calcular promedio de desempeño
    const averagePerformance = calculateAveragePerformance(evaluation);

    // Crear elementos del documento
    const children: (Paragraph | Table)[] = [];

    // Encabezado principal del contenido
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "CEPRUNSA - CENTRO DE ESTUDIOS PREUNIVERSITARIOS",
            bold: true,
            size: 28,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "UNIVERSIDAD NACIONAL DE SAN AGUSTÍN DE AREQUIPA",
            bold: true,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "FICHA DE EVALUACIÓN DOCENTE",
            bold: true,
            size: 32,
            color: "1565C0",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );

    // Tabla de información del docente con colores azules
    children.push(
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Docente:", bold: true })],
                  }),
                ],
                width: { size: 25, type: WidthType.PERCENTAGE },
                shading: { fill: "E3F2FD", type: ShadingType.SOLID },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${teacher.apellidos}, ${teacher.nombres}`,
                      }),
                    ],
                  }),
                ],
                width: { size: 75, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "DNI:", bold: true })],
                  }),
                ],
                shading: { fill: "E3F2FD", type: ShadingType.SOLID },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: teacher.dni })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Curso:", bold: true })],
                  }),
                ],
                shading: { fill: "E3F2FD", type: ShadingType.SOLID },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: teacher.curso.toUpperCase() }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Evaluador:", bold: true })],
                  }),
                ],
                shading: { fill: "E3F2FD", type: ShadingType.SOLID },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: evaluation.evaluatorName })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Fecha:", bold: true })],
                  }),
                ],
                shading: { fill: "E3F2FD", type: ShadingType.SOLID },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: formatDateTime(evaluation.date, evaluation.time),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
          insideHorizontal: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: "1565C0",
          },
          insideVertical: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: "1565C0",
          },
        },
      })
    );

    // Espacio después de la tabla de información
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "" })],
        spacing: { after: 400 },
      })
    );

    // Tabla de desempeños con colores azules y colores por nivel
    const performanceRows: TableRow[] = [];

    // Encabezado de la tabla de desempeños
    performanceRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "DESEMPEÑO",
                    bold: true,
                    size: 22,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "1565C0", type: ShadingType.SOLID },
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "NIVEL",
                    bold: true,
                    size: 22,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "1565C0", type: ShadingType.SOLID },
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "DESCRIPCIÓN",
                    bold: true,
                    size: 22,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "1565C0", type: ShadingType.SOLID },
            width: { size: 35, type: WidthType.PERCENTAGE },
          }),
        ],
      })
    );

    // Filas de desempeños con colores según nivel
    Object.entries(performanceTitles).forEach(([performance, title], index) => {
      const performanceKey = `performance${
        index + 1
      }` as keyof typeof evaluation;
      const level = evaluation[performanceKey] as string;
      const description = getPerformanceDescription(performance, level);
      const levelColor = getPerformanceLevelColor(level);

      console.log(
        `Performance ${index + 1}: Level ${level}, Color: ${levelColor}`
      );

      performanceRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: title, size: 20 })],
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Nivel ${level}`,
                      bold: true,
                      size: 20,
                      color: "FFFFFF",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 15, type: WidthType.PERCENTAGE },
              shading: {
                fill: levelColor,
                type: ShadingType.SOLID,
                color: levelColor,
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: description, size: 20 })],
                }),
              ],
              width: { size: 35, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
    });

    // Fila de promedio con color azul
    const averageLevel = getAverageLevelText(averagePerformance);
    performanceRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "PROMEDIO GENERAL",
                    bold: true,
                    size: 22,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: {
              fill: "0D47A1",
              type: ShadingType.SOLID,
              color: "0D47A1",
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: averagePerformance.toFixed(2),
                    bold: true,
                    size: 22,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: {
              fill: "0D47A1",
              type: ShadingType.SOLID,
              color: "0D47A1",
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: averageLevel,
                    bold: true,
                    size: 22,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: {
              fill: "0D47A1",
              type: ShadingType.SOLID,
              color: "0D47A1",
            },
          }),
        ],
      })
    );

    children.push(
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: performanceRows,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
          insideHorizontal: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: "1565C0",
          },
          insideVertical: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: "1565C0",
          },
        },
      })
    );

    // Sección de observaciones
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "OBSERVACIONES Y COMENTARIOS",
            bold: true,
            size: 28,
            color: "1565C0",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Observaciones Generales:",
            bold: true,
            size: 24,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: evaluation.observations || "No se registraron observaciones.",
            size: 22,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Fortalezas Identificadas:",
            bold: true,
            size: 24,
          }),
        ],
        spacing: { after: 100 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: evaluation.strengths || "No se registraron fortalezas.",
            size: 22,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Áreas de Mejora:", bold: true, size: 24 }),
        ],
        spacing: { after: 100 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text:
              evaluation.improvementAreas ||
              "No se registraron áreas de mejora.",
            size: 22,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Compromisos:", bold: true, size: 24 })],
        spacing: { after: 100 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: evaluation.commitments || "No se registraron compromisos.",
            size: 22,
          }),
        ],
        spacing: { after: 400 },
      })
    );

    // Sección de evidencia fotográfica
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EVIDENCIA FOTOGRÁFICA",
            bold: true,
            size: 28,
            color: "1565C0",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      })
    );

    if (evaluation.evidenceImageBase64) {
      try {
        console.log("Procesando imagen de evidencia...");

        // Convertir base64 a Uint8Array
        const imageBuffer = base64ToUint8Array(evaluation.evidenceImageBase64);

        // Detectar el tipo de imagen
        const detectedType = evaluation.evidenceImageBase64
          .split(";")[0]
          .split(":")[1]
          .split("/")[1];

        // Mapear tipos no soportados a tipos soportados
        const imageType =
          detectedType === "jpeg" || detectedType === "webp"
            ? "png"
            : (detectedType as "jpg" | "png" | "gif" | "bmp");

        // Función para obtener dimensiones de imagen desde base64
        const getImageDimensions = (
          base64: string
        ): Promise<{ width: number; height: number }> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              resolve({ width: img.width, height: img.height });
            };
            img.onerror = reject;
            img.src = base64;
          });
        };

        // Obtener dimensiones originales
        const originalDimensions = await getImageDimensions(
          evaluation.evidenceImageBase64
        );

        // Calcular dimensiones manteniendo proporción
        const maxWidth = 600; // Ancho máximo en el documento
        const maxHeight = 450; // Alto máximo en el documento

        let finalWidth = originalDimensions.width;
        let finalHeight = originalDimensions.height;

        // Escalar si excede el ancho máximo
        if (finalWidth > maxWidth) {
          const ratio = maxWidth / finalWidth;
          finalWidth = maxWidth;
          finalHeight = finalHeight * ratio;
        }

        // Escalar si excede el alto máximo después del escalado por ancho
        if (finalHeight > maxHeight) {
          const ratio = maxHeight / finalHeight;
          finalHeight = maxHeight;
          finalWidth = finalWidth * ratio;
        }

        console.log(
          `Dimensiones originales: ${originalDimensions.width}x${originalDimensions.height}`
        );
        console.log(
          `Dimensiones finales: ${Math.round(finalWidth)}x${Math.round(
            finalHeight
          )}`
        );

        // Crear la imagen con proporciones mantenidas
        const imageRun = new ImageRun({
          data: imageBuffer,
          transformation: {
            width: Math.round(finalWidth),
            height: Math.round(finalHeight),
          },
          type: imageType,
        });

        children.push(
          new Paragraph({
            children: [imageRun],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Imagen de evidencia (${Math.round(
                  finalWidth
                )}x${Math.round(finalHeight)}px)`,
                italics: true,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );

        console.log("Imagen procesada correctamente manteniendo proporciones");
      } catch (error) {
        console.error("Error al procesar imagen:", error);
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Error al cargar la imagen de evidencia",
                color: "FF0000",
                size: 22,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
      }
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "No se adjuntó imagen de evidencia para esta evaluación",
              italics: true,
              size: 22,
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    // Crear el encabezado con marca de agua
    const documentHeader = await createDocumentHeader();

    // Crear el documento con encabezado y pie de página
    const doc = new Document({
      sections: [
        {
          properties: {
            type: SectionType.CONTINUOUS,
            page: {
              margin: {
                top: convertInchesToTwip(1), // Margen superior aumentado para el encabezado con logo
                bottom: convertInchesToTwip(1), // Margen inferior para el pie de página
                left: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
              },
            },
          },
          headers: {
            default: documentHeader,
          },
          footers: {
            default: createDocumentFooter(),
          },
          children: children,
        },
      ],
    });

    console.log("Documento creado, generando blob...");

    // Generar el documento
    const blob = await Packer.toBlob(doc);

    // Generar nombre del archivo
    const fileName = `Evaluacion_${teacher.apellidos.replace(
      /\s+/g,
      "_"
    )}_${teacher.nombres.replace(/\s+/g, "_")}_${evaluation.date.replace(
      /-/g,
      ""
    )}.docx`;

    console.log("Descargando archivo:", fileName);

    // Descargar el archivo
    saveAs(blob, fileName);
  } catch (error: any) {
    console.error("Error al generar el documento:", error);
    throw new Error(`No se pudo generar el documento: ${error.message}`);
  }
};

// Función para generar múltiples evaluaciones en un solo documento
export const generateMultipleEvaluationsDocument = async (
  evaluationsData: Array<{ teacher: Teacher; evaluation: TeacherEvaluation }>
): Promise<void> => {
  try {
    console.log("Generando documento con múltiples evaluaciones...");

    const children: (Paragraph | Table)[] = [];

    // Agregar cada evaluación
    for (let i = 0; i < evaluationsData.length; i++) {
      const { teacher, evaluation } = evaluationsData[i];
      const averagePerformance = calculateAveragePerformance(evaluation);

      // Encabezado para cada evaluación
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `EVALUACIÓN ${i + 1} - ${teacher.apellidos}, ${
                teacher.nombres
              }`,
              bold: true,
              size: 24,
              color: "1565C0",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: i > 0 ? 600 : 0, after: 400 },
        })
      );

      // Información básica en tabla con colores azules
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Curso:", bold: true })],
                    }),
                  ],
                  shading: { fill: "E3F2FD", type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: teacher.curso.toUpperCase() }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Evaluador:", bold: true }),
                      ],
                    }),
                  ],
                  shading: { fill: "E3F2FD", type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: evaluation.evaluatorName }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Fecha:", bold: true })],
                    }),
                  ],
                  shading: { fill: "E3F2FD", type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: formatDate(evaluation.date) }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Promedio:", bold: true }),
                      ],
                    }),
                  ],
                  shading: { fill: "E3F2FD", type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${averagePerformance.toFixed(
                            2
                          )} - ${getAverageLevelText(averagePerformance)}`,
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "1565C0" },
            insideHorizontal: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "1565C0",
            },
            insideVertical: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "1565C0",
            },
          },
        })
      );

      // Agregar salto de página si no es la última evaluación
      if (i < evaluationsData.length - 1) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }

    // Crear el encabezado con marca de agua
    const documentHeader = await createDocumentHeader();

    // Crear el documento con encabezado y pie de página
    const doc = new Document({
      sections: [
        {
          properties: {
            type: SectionType.CONTINUOUS,
            page: {
              margin: {
                top: convertInchesToTwip(1.5),
                bottom: convertInchesToTwip(1.2),
                left: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
              },
            },
          },
          headers: {
            default: documentHeader,
          },
          footers: {
            default: createDocumentFooter(),
          },
          children: children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Reporte_Evaluaciones_${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}.docx`;

    saveAs(blob, fileName);
  } catch (error: any) {
    console.error("Error al generar el documento múltiple:", error);
    throw new Error(`No se pudo generar el documento: ${error.message}`);
  }
};
