"use client";

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

interface EvaluatorRouteProps {
  children: ReactNode;
}

const EvaluatorRoute = ({ children }: EvaluatorRouteProps) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Solo administradores y evaluadores pueden acceder
  if (!isAdmin && user.role !== "evaluator") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default EvaluatorRoute;
