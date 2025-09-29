import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="sticky top-0 bg-black/80 shadow-md z-10">
      <nav className="flex justify-between items-center px-8 py-4">
        <Link to="/" className="flex items-center  duration-200 gap-3">
          <img
            src="/banner.png"
            alt="The Elder Cards"
            className="h-30 w-60 object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] transition duration-300 hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.85)]"
          />
        </Link>

        <ul className="flex text-white text-2xl space-x-8">
          <li>
            <Link to="/" className="hover:text-gray-500">
              Inicio
            </Link>
          </li>
          <li>
            <Link to="/cards" className="hover:text-gray-500">
              Cartas
            </Link>
          </li>
          <li>
            <a href="#colecciones" className="hover:text-gray-500">
              Colecciones
            </a>
          </li>
          <li>
            <Link to="/factions" className="hover:text-gray-500">
              Facciones
            </Link>
          </li>
          <li>
            <a href="#contacto" className="hover:text-gray-500">
              Contacto
            </a>
          </li>
        </ul>

        <ul className="flex text-white text-2xl space-x-8">
          {!user ? (
            <>
              <li>
                <Link to="/register" className="hover:text-gray-500">
                  Registro
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-gray-500">
                  Login
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/profile" className="hover:text-gray-500">
                  Perfil
                </Link>
              </li>
              <li>
                <button onClick={logout} className="hover:text-red-500">
                  Cerrar sesión
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}

export default Navbar;
