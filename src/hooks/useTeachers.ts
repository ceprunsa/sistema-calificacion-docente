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
import type { Teacher, TeacherFormData } from "../types/teacher";
import toast from "react-hot-toast";

export const useTeachers = () => {
  const queryClient = useQueryClient();

  // React Query hooks
  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: getTeachers,
  });

  const teacherByIdQuery = (id?: string) => {
    return useQuery({
      queryKey: ["teachers", id],
      queryFn: () => getTeacherById(id),
      enabled: !!id,
    });
  };

  const saveTeacherMutation = useMutation({
    mutationFn: saveTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });

  const importTeachersMutation = useMutation({
    mutationFn: importTeachers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });

  return {
    teachers: teachersQuery.data || [],
    isLoading: teachersQuery.isLoading,
    isError: teachersQuery.isError,
    error: teachersQuery.error as Error | null,
    teacherByIdQuery,
    saveTeacher: saveTeacherMutation.mutate,
    deleteTeacher: deleteTeacherMutation.mutate,
    importTeachers: importTeachersMutation.mutate,
    isSaving: saveTeacherMutation.isPending,
    isDeleting: deleteTeacherMutation.isPending,
    isImporting: importTeachersMutation.isPending,
  };
};

const getTeachers = async (): Promise<Teacher[]> => {
  const teachersRef = collection(db, "teachers");
  const q = query(teachersRef, orderBy("apellidos", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Teacher)
  );
};

const getTeacherById = async (id?: string): Promise<Teacher | null> => {
  if (!id) return null;
  const docRef = doc(db, "teachers", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Teacher;
  }
  return null;
};

const checkDniExists = async (
  dni: string,
  excludeId?: string
): Promise<boolean> => {
  const teachersRef = collection(db, "teachers");
  const q = query(teachersRef, where("dni", "==", dni));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return false;

  // Si estamos editando, excluimos el ID actual
  if (excludeId) {
    return snapshot.docs.some((doc) => doc.id !== excludeId);
  }

  return true;
};

const calculateTotalHours = (horasPorTurno: Record<string, number>): number => {
  return Object.values(horasPorTurno).reduce(
    (total, hours) => total + hours,
    0
  );
};

const saveTeacher = async (teacherData: TeacherFormData): Promise<Teacher> => {
  const now = new Date().toISOString();

  // Calcular el total de horas
  const totalHoras = calculateTotalHours(teacherData.horasPorTurno);

  if (teacherData.id) {
    // Actualizar docente existente
    const teacherRef = doc(db, "teachers", teacherData.id);

    // Verificar si el DNI ya existe (excluyendo el docente actual)
    const dniExists = await checkDniExists(teacherData.dni, teacherData.id);
    if (dniExists) {
      throw new Error(
        `El DNI ${teacherData.dni} ya está registrado para otro docente`
      );
    }

    // Extraemos el id para no incluirlo en los datos a actualizar
    const { id, ...teacherDataWithoutId } = teacherData;

    const updatedTeacher = {
      ...teacherDataWithoutId,
      totalHoras,
      updatedAt: now,
    };

    await updateDoc(teacherRef, updatedTeacher);

    toast.success("Docente actualizado exitosamente");
    return { ...updatedTeacher, id: teacherData.id } as Teacher;
  } else {
    // Crear nuevo docente
    // Verificar si el DNI ya existe
    const dniExists = await checkDniExists(teacherData.dni);
    if (dniExists) {
      throw new Error(`El DNI ${teacherData.dni} ya está registrado`);
    }

    // Extraemos el id si existe (aunque debería ser undefined para nuevos docentes)
    const { id, ...teacherDataWithoutId } = teacherData;

    const newTeacher = {
      ...teacherDataWithoutId,
      totalHoras,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "teachers"), newTeacher);

    toast.success("Docente creado exitosamente");
    return { ...newTeacher, id: docRef.id } as Teacher;
  }
};

const deleteTeacher = async (id: string): Promise<string> => {
  try {
    await deleteDoc(doc(db, "teachers", id));
    toast.success("Docente eliminado exitosamente");
    return id;
  } catch (error) {
    console.error("Error al eliminar docente:", error);
    toast.error("Error al eliminar docente");
    throw error;
  }
};

const importTeachers = async (
  teachersData: TeacherFormData[]
): Promise<number> => {
  try {
    let importedCount = 0;
    const now = new Date().toISOString();

    for (const teacherData of teachersData) {
      try {
        // Verificar si el DNI ya existe
        const dniExists = await checkDniExists(teacherData.dni);
        if (dniExists) {
          toast.error(
            `El DNI ${teacherData.dni} ya está registrado. Se omitirá este registro.`
          );
          continue;
        }

        // Calcular el total de horas
        const totalHoras = calculateTotalHours(teacherData.horasPorTurno);

        const newTeacher = {
          ...teacherData,
          totalHoras,
          createdAt: now,
          updatedAt: now,
        };

        await addDoc(collection(db, "teachers"), newTeacher);
        importedCount++;
      } catch (error) {
        console.error(
          `Error al importar docente con DNI ${teacherData.dni}:`,
          error
        );
        toast.error(`Error al importar docente con DNI ${teacherData.dni}`);
      }
    }

    if (importedCount > 0) {
      toast.success(`Se importaron ${importedCount} docentes exitosamente`);
    }

    return importedCount;
  } catch (error) {
    console.error("Error al importar docentes:", error);
    toast.error("Error al importar docentes");
    throw error;
  }
};
