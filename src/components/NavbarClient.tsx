import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext"; // Asegúrate que el nombre del archivo del contexto sea correcto.
import "./index.css";

const NavbarClient = () => {
  const { isAuthenticated, logout, tipoUsuario } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");  
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>My Website</h1>
      </div>
      <ul className="navbar-list">
        <li><Link to="/dashboard-cliente">Inicio</Link></li>
        <li><Link to="products">Productos</Link></li>
        <li><Link to="contact">Contactos</Link></li>
        {isAuthenticated && tipoUsuario === "Distribuidor" && (
          <li><Link to="/dashboard-distribuidor">Distribuidor</Link></li>
        )}
        {isAuthenticated && tipoUsuario === "Cliente" && (
          <li><Link to="/dashboard-cliente">Mi Cuenta</Link></li>
        )}
      </ul>

      <div className="buttons">
          <button onClick={handleLogout}>Cerrar sesión</button>
        
      </div>
    </nav>
  );
};

export default NavbarClient;
