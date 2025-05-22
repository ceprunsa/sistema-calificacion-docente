import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserForm from "./pages/UserForm";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Profile from "./pages/Profile";
import Teachers from "./pages/Teachers";
import TeacherForm from "./pages/TeacherForm";
import TeacherImport from "./pages/TeacherImport";
import TeacherDetails from "./pages/TeacherDetails";
import TeacherEvaluations from "./pages/TeacherEvaluations";
import EvaluationForm from "./pages/EvaluationForm";
import EvaluationDetails from "./pages/EvaluationDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <AdminRoute>
            <Users />
          </AdminRoute>
        ),
      },
      {
        path: "users/new",
        element: (
          <AdminRoute>
            <UserForm />
          </AdminRoute>
        ),
      },
      {
        path: "users/:id",
        element: (
          <AdminRoute>
            <UserForm />
          </AdminRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "teachers",
        element: (
          <ProtectedRoute>
            <Teachers />
          </ProtectedRoute>
        ),
      },
      {
        path: "teachers/new",
        element: (
          <ProtectedRoute>
            <TeacherForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "teachers/:id",
        element: (
          <ProtectedRoute>
            <TeacherForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "teachers/:id/details",
        element: (
          <ProtectedRoute>
            <TeacherDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "teachers/import",
        element: (
          <ProtectedRoute>
            <TeacherImport />
          </ProtectedRoute>
        ),
      },
      // Nuevas rutas para evaluaciones
      {
        path: "teachers/:id/evaluations",
        element: (
          <ProtectedRoute>
            <TeacherEvaluations />
          </ProtectedRoute>
        ),
      },
      {
        path: "teachers/:teacherId/evaluations/new",
        element: (
          <ProtectedRoute>
            <EvaluationForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "teachers/:teacherId/evaluations/:evaluationId/edit",
        element: (
          <ProtectedRoute>
            <EvaluationForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "teachers/:teacherId/evaluations/:evaluationId/view",
        element: (
          <ProtectedRoute>
            <EvaluationDetails />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
