import { Link } from "react-router-dom";
import "./index.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>My Website</h1>
      </div>
      <ul className="navbar-list">
        <li className="navbar-item">
          <Link to="/">Inicio</Link>
        </li>
        <li className="navbar-item">
          <Link to="/about">Productos</Link>
        </li>
        <li className="navbar-item">
          <Link to="/contact">Contactos</Link>
        </li>
      </ul>
      <div className="buttons">
        <Link to={"/Login"}><button>Iniciar sesion</button></Link>
        
      </div>
    </nav>
  );
}
export default Navbar;