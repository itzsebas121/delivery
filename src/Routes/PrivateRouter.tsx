import { useAuth } from "../context/Authcontext";
import { Navigate, Outlet } from "react-router-dom";
const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Cargando...</div>; // O un loader bonito

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};
export default PrivateRoute;
