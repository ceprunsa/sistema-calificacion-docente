"use client";

import type React from "react";

import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEvaluations } from "../hooks/useEvaluations";
import { useTeachers } from "../hooks/useTeachers";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import type { EvaluationFormData, PerformanceLevel } from "../types/evaluation";
import {
  performanceDescriptions,
  performanceTitles,
  levelDescriptions,
} from "../types/evaluation";
import { capitalizeText } from "../utils/formatters";
import { Save, X, HelpCircle, Calendar } from "lucide-react";

const EvaluationForm = () => {
  const { teacherId, evaluationId } = useParams<{
    teacherId: string;
    evaluationId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teacherByIdQuery } = useTeachers();
  const { useEvaluationById, saveEvaluation, isSaving } = useEvaluations();

  const { data: teacher, isLoading: isLoadingTeacher } =
    teacherByIdQuery(teacherId);
  const { data: existingEvaluation, isLoading: isLoadingEvaluation } =
    useEvaluationById(evaluationId);

  const [formData, setFormData] = useState<EvaluationFormData>({
    teacherId: teacherId || "",
    evaluatorId: user?.id || "",
    evaluatorName: user?.displayName || user?.email || "",
    date: new Date().toISOString().split("T")[0],
    reflectiveDialogueDate: null,
    performance1: "I",
    performance2: "I",
    performance3: "I",
    performance4: "I",
    performance5: "I",
    performance6: "I",
    observations: "",
    strengths: "",
    improvementAreas: "",
    commitments: "",
  });

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    if (existingEvaluation) {
      // Asegurarse de que todos los campos necesarios estén presentes
      const safeEvaluation = {
        teacherId: existingEvaluation.teacherId || teacherId || "",
        evaluatorId: existingEvaluation.evaluatorId || user?.id || "",
        evaluatorName:
          existingEvaluation.evaluatorName ||
          user?.displayName ||
          user?.email ||
          "",
        date: existingEvaluation.date || new Date().toISOString().split("T")[0],
        reflectiveDialogueDate: existingEvaluation.reflectiveDialogueDate,
        performance1: existingEvaluation.performance1 || "I",
        performance2: existingEvaluation.performance2 || "I",
        performance3: existingEvaluation.performance3 || "I",
        performance4: existingEvaluation.performance4 || "I",
        performance5: existingEvaluation.performance5 || "I",
        performance6: existingEvaluation.performance6 || "I",
        observations: existingEvaluation.observations || "",
        strengths: existingEvaluation.strengths || "",
        improvementAreas: existingEvaluation.improvementAreas || "",
        commitments: existingEvaluation.commitments || "",
      };

      setFormData(safeEvaluation);
    } else if (teacherId) {
      setFormData((prev) => ({
        ...prev,
        teacherId,
      }));
    }
  }, [existingEvaluation, teacherId, user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePerformanceChange = (
    performance: string,
    level: PerformanceLevel
  ) => {
    setFormData((prev) => ({
      ...prev,
      [performance]: level,
    }));
  };

  const toggleTooltip = (tooltipId: string) => {
    if (activeTooltip === tooltipId) {
      setActiveTooltip(null);
    } else {
      setActiveTooltip(tooltipId);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.teacherId) {
      toast.error("Debe seleccionar un docente");
      return;
    }

    if (!formData.date) {
      toast.error("Debe ingresar la fecha de evaluación");
      return;
    }

    try {
      // Crear una copia del formData para enviar
      const evaluationData = {
        ...formData,
      };

      // Si estamos editando, incluimos el ID en los datos
      if (evaluationId) {
        evaluationData.id = evaluationId;
      }

      saveEvaluation(evaluationData);
      navigate(`/teachers/${teacherId}/evaluations`);
    } catch (error) {
      console.error("Error al guardar evaluación:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar evaluación"
      );
    }
  };

  if (
    (teacherId && isLoadingTeacher) ||
    (evaluationId && isLoadingEvaluation)
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (teacherId && !teacher) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {" "}
          No se encontró el docente especificado.
        </span>
        <div className="mt-4">
          <button
            onClick={() => navigate("/teachers")}
            className="btn btn-secondary"
          >
            Volver a la lista de docentes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {evaluationId ? "Editar Evaluación" : "Nueva Evaluación"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {evaluationId
                ? "Actualice la información de la evaluación del docente"
                : "Complete el formulario para registrar una nueva evaluación del docente"}
            </p>

            {teacher && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800">
                  Información del Docente
                </h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Nombre:</span>{" "}
                    {teacher.apellidos}, {teacher.nombres}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">DNI:</span> {teacher.dni}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Curso:</span>{" "}
                    {capitalizeText(teacher.curso)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">
                Niveles de Logro
              </h4>
              <div className="mt-2 space-y-2">
                {Object.entries(levelDescriptions).map(
                  ([level, description]) => (
                    <div key={level} className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-blue-100 text-blue-800 font-medium text-xs">
                        {level}
                      </div>
                      <p className="text-xs text-gray-600">{description}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 bg-white sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  {/* Fechas */}
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Fecha de Monitoreo
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="date"
                        id="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="reflectiveDialogueDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Fecha de Diálogo Reflexivo (Opcional)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="reflectiveDialogueDate"
                        id="reflectiveDialogueDate"
                        value={formData.reflectiveDialogueDate || ""}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Desempeños */}
                  <div className="col-span-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Evaluación de Desempeños
                    </h3>

                    {Object.entries(performanceTitles).map(
                      ([performance, title]) => (
                        <div
                          key={performance}
                          className="mb-6 border rounded-lg overflow-hidden"
                        >
                          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              {title}
                              <button
                                type="button"
                                onClick={() => toggleTooltip(performance)}
                                className="ml-2 text-gray-400 hover:text-gray-500"
                              >
                                <HelpCircle size={16} />
                              </button>
                            </h4>
                          </div>

                          {activeTooltip === performance && (
                            <div className="px-4 py-3 bg-blue-50 border-t border-b border-blue-100">
                              <h5 className="text-xs font-medium text-blue-800 mb-2">
                                Descripción de los niveles:
                              </h5>
                              <ul className="space-y-2">
                                {Object.entries(
                                  performanceDescriptions[
                                    performance as keyof typeof performanceDescriptions
                                  ]
                                ).map(([level, desc]) => (
                                  <li
                                    key={level}
                                    className="text-xs text-gray-600 flex"
                                  >
                                    <span className="font-medium text-blue-800 mr-1">
                                      Nivel {level}:
                                    </span>{" "}
                                    {desc}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {["I", "II", "III", "IV"].map((level) => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() =>
                                    handlePerformanceChange(
                                      performance,
                                      level as PerformanceLevel
                                    )
                                  }
                                  className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                    formData[
                                      performance as keyof typeof formData
                                    ] === level
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  Nivel {level}
                                </button>
                              ))}
                            </div>

                            <div className="mt-3 text-sm text-gray-500">
                              <p>
                                <span className="font-medium">
                                  Nivel seleccionado:
                                </span>{" "}
                                {formData[performance as keyof typeof formData]}{" "}
                                -{" "}
                                {
                                  performanceDescriptions[
                                    performance as keyof typeof performanceDescriptions
                                  ][
                                    formData[
                                      performance as keyof typeof formData
                                    ] as PerformanceLevel
                                  ]
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Observaciones y comentarios */}
                  <div className="col-span-6">
                    <label
                      htmlFor="observations"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Observaciones Generales
                    </label>
                    <textarea
                      id="observations"
                      name="observations"
                      rows={3}
                      value={formData.observations}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Ingrese observaciones generales sobre el desempeño del docente"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="strengths"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Fortalezas Identificadas
                    </label>
                    <textarea
                      id="strengths"
                      name="strengths"
                      rows={3}
                      value={formData.strengths}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Describa las fortalezas identificadas en el docente"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="improvementAreas"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Áreas de Mejora
                    </label>
                    <textarea
                      id="improvementAreas"
                      name="improvementAreas"
                      rows={3}
                      value={formData.improvementAreas}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Describa las áreas en las que el docente puede mejorar"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="commitments"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Compromisos
                    </label>
                    <textarea
                      id="commitments"
                      name="commitments"
                      rows={3}
                      value={formData.commitments}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Describa los compromisos acordados con el docente"
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate(`/teachers/${teacherId}/evaluations`)}
                  className="btn btn-secondary mr-3 inline-flex items-center"
                  title="Cancelar"
                >
                  <X size={18} className="mr-2" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary inline-flex items-center"
                  title="Guardar evaluación"
                >
                  <Save size={18} className="mr-2" />
                  <span>{isSaving ? "Guardando..." : "Guardar"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;
