import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();

  // Show nothing (or a spinner) while checking auth
  if (loading) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
