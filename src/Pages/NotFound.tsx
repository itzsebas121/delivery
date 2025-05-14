
import { Link } from "react-router-dom";
import "./NotFound.css"; // Asegúrate de importar el CSS

const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <h1 className="notfound-title">404</h1>
        <p className="notfound-message">Página no encontrada</p>
        <Link to="/" className="notfound-link">Volver al inicio</Link>
      </div>
    </div>
  );
};

export default NotFound;
