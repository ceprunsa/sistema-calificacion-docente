"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type {
  TeacherEvaluation,
  EvaluationFormData,
} from "../types/evaluation";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

const getEvaluations = async (): Promise<TeacherEvaluation[]> => {
  const evaluationsRef = collection(db, "evaluations");
  const q = query(evaluationsRef, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as TeacherEvaluation)
  );
};

// Modificar la función getEvaluationsByTeacherId para manejar mejor los casos de error
const getEvaluationsByTeacherId = async (
  teacherId: string
): Promise<TeacherEvaluation[]> => {
  if (!teacherId) {
    console.warn(
      "Se intentó obtener evaluaciones sin proporcionar un teacherId válido"
    );
    return [];
  }

  try {
    const evaluationsRef = collection(db, "evaluations");
    const q = query(
      evaluationsRef,
      where("teacherId", "==", teacherId),
      orderBy("date", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as TeacherEvaluation)
    );
  } catch (error) {
    console.error("Error al obtener evaluaciones por teacherId:", error);
    throw error;
  }
};

const getEvaluationById = async (
  id?: string
): Promise<TeacherEvaluation | null> => {
  if (!id) return null;
  const docRef = doc(db, "evaluations", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as TeacherEvaluation;
  }
  return null;
};

// Mejorar la función saveEvaluation para manejar mejor los errores
const saveEvaluation = async (
  evaluationData: EvaluationFormData,
  queryClient: any,
  user: any
): Promise<TeacherEvaluation> => {
  const now = new Date().toISOString();

  try {
    if (evaluationData.id) {
      // Actualizar evaluación existente
      const evaluationRef = doc(db, "evaluations", evaluationData.id);

      // Extraemos el id para no incluirlo en los datos a actualizar
      const { id, ...evaluationDataWithoutId } = evaluationData;

      const updatedEvaluation = {
        ...evaluationDataWithoutId,
        updatedAt: now,
      };

      await updateDoc(evaluationRef, updatedEvaluation);

      toast.success("Evaluación actualizada exitosamente");
      return {
        ...updatedEvaluation,
        id: evaluationData.id,
      } as TeacherEvaluation;
    } else {
      // Crear nueva evaluación
      // Asegurarse de que el evaluador esté establecido
      if (!evaluationData.evaluatorId && user) {
        evaluationData.evaluatorId = user.id;
        evaluationData.evaluatorName = user.displayName || user.email;
      }

      // Extraemos el id si existe (aunque debería ser undefined para nuevas evaluaciones)
      const { id, ...evaluationDataWithoutId } = evaluationData;

      const newEvaluation = {
        ...evaluationDataWithoutId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, "evaluations"), newEvaluation);

      toast.success("Evaluación registrada exitosamente");
      return { ...newEvaluation, id: docRef.id } as TeacherEvaluation;
    }
  } catch (error) {
    console.error("Error al guardar evaluación:", error);
    toast.error("Error al guardar la evaluación. Inténtelo de nuevo.");
    throw error;
  }
};

const deleteEvaluation = async (id: string): Promise<string> => {
  try {
    await deleteDoc(doc(db, "evaluations", id));
    toast.success("Evaluación eliminada exitosamente");
    return id;
  } catch (error) {
    console.error("Error al eliminar evaluación:", error);
    toast.error("Error al eliminar evaluación");
    throw error;
  }
};

export const useEvaluations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // React Query hooks
  const evaluationsQuery = useQuery({
    queryKey: ["evaluations"],
    queryFn: getEvaluations,
  });

  // Modificar la función useEvaluationsByTeacherId para mejorar el manejo de errores
  const useEvaluationsByTeacherId = (teacherId: string) => {
    return useQuery({
      queryKey: ["evaluations", "teacher", teacherId],
      queryFn: () => getEvaluationsByTeacherId(teacherId),
      enabled: !!teacherId,
      retry: 2, // Intentar la consulta hasta 2 veces en caso de error
      staleTime: 1000 * 60 * 5, // 5 minutos
    });
  };

  // Función para obtener una evaluación por ID
  const useEvaluationById = (id?: string) => {
    return useQuery({
      queryKey: ["evaluations", "id", id],
      queryFn: () => getEvaluationById(id),
      enabled: !!id,
    });
  };

  // Mejorar las mutaciones para manejar mejor los errores
  const saveEvaluationMutation = useMutation({
    mutationFn: (evaluationData: EvaluationFormData) =>
      saveEvaluation(evaluationData, queryClient, user),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({
        queryKey: ["evaluations", "teacher", data.teacherId],
      });
      if (data.id) {
        queryClient.invalidateQueries({
          queryKey: ["evaluations", "id", data.id],
        });
      }
    },
    onError: (error) => {
      console.error("Error en la mutación de guardar evaluación:", error);
      toast.error(
        "No se pudo guardar la evaluación. Por favor, inténtelo de nuevo."
      );
    },
  });

  const deleteEvaluationMutation = useMutation({
    mutationFn: deleteEvaluation,
    onSuccess: (deletedId, variables) => {
      // Intentar obtener el teacherId de la evaluación eliminada desde el caché
      const evaluations =
        queryClient.getQueryData<TeacherEvaluation[]>(["evaluations"]) || [];
      const deletedEvaluation = evaluations.find((e) => e.id === deletedId);

      queryClient.invalidateQueries({ queryKey: ["evaluations"] });

      // Si encontramos la evaluación, invalidamos también la consulta específica del profesor
      if (deletedEvaluation) {
        queryClient.invalidateQueries({
          queryKey: ["evaluations", "teacher", deletedEvaluation.teacherId],
        });
      }
    },
    onError: (error) => {
      console.error("Error en la mutación de eliminar evaluación:", error);
      toast.error(
        "No se pudo eliminar la evaluación. Por favor, inténtelo de nuevo."
      );
    },
  });

  return {
    evaluations: evaluationsQuery.data || [],
    isLoadingEvaluations: evaluationsQuery.isLoading,
    isErrorEvaluations: evaluationsQuery.isError,
    errorEvaluations: evaluationsQuery.error as Error | null,
    useEvaluationsByTeacherId,
    useEvaluationById,
    saveEvaluation: saveEvaluationMutation.mutate,
    deleteEvaluation: deleteEvaluationMutation.mutate,
    isSaving: saveEvaluationMutation.isPending,
    isDeleting: deleteEvaluationMutation.isPending,
  };
};
