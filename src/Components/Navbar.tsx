import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { DEFAULT_PROFILE_IMAGE } from "../constants/user";

type PrimaryLink = {
  to: string;
  label: string;
  isAnchor?: boolean;
};

const primaryLinks: PrimaryLink[] = [
  { to: "/", label: "Inicio" },
  { to: "/cards", label: "Cartas" },
  { to: "/collections", label: "Colecciones" },
  { to: "/factions", label: "Facciones" },
  { to: "#contacto", label: "Contacto", isAnchor: true },
];

function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCloseMenu = () => setMenuOpen(false);

  // Close menu when clicking outside
  const handleBackdropClick = () => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile menu backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <header className="sticky top-0 z-50 bg-black/95 shadow-md backdrop-blur border-b border-white/10">
        <nav className="mx-auto flex w-full max-w-[2800px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 text-white transition hover:opacity-80"
              onClick={handleCloseMenu}
            >
              <img
                src="/banner.png"
                alt="The Elder Cards"
                className="h-16 w-40 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] transition duration-300 hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.85)] sm:h-20 sm:w-52"
              />
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10 lg:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
            >
              <span className="sr-only">
                {menuOpen ? "Cerrar menú" : "Abrir menú"}
              </span>
              <svg
                className={`h-6 w-6 transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          <div
            id="primary-navigation"
            className={`${
              menuOpen ? "flex" : "hidden"
            } flex-col gap-6 border-t border-white/10 pt-4 text-white lg:flex lg:flex-row lg:items-center lg:justify-between lg:border-none lg:pt-0`}
          >
            <ul className="flex flex-col gap-4 text-lg lg:flex-row lg:items-center lg:gap-8 lg:text-base xl:text-lg">
              {primaryLinks.map((link) => (
                <li key={link.to}>
                  {link.isAnchor ? (
                    <a
                      href={link.to}
                      className="block py-2 transition hover:text-gray-300 lg:py-0"
                      onClick={handleCloseMenu}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="block py-2 transition hover:text-gray-300 lg:py-0"
                      onClick={handleCloseMenu}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-4 border-t border-white/10 pt-4 text-lg lg:border-none lg:pt-0 lg:flex-row lg:items-center lg:gap-6 lg:text-base xl:text-lg">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="block py-2 transition hover:text-gray-300 lg:py-0"
                    onClick={handleCloseMenu}
                  >
                    Registro
                  </Link>
                  <Link
                    to="/login"
                    className="inline-block rounded-lg bg-white/10 px-4 py-2 text-center transition hover:bg-white/20 lg:bg-transparent lg:hover:bg-white/10"
                    onClick={handleCloseMenu}
                  >
                    Iniciar sesión
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 py-2 transition hover:text-gray-300 lg:py-0"
                    onClick={handleCloseMenu}
                  >
                    <img
                      src={user.image || DEFAULT_PROFILE_IMAGE}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover border border-white/30 shadow-sm"
                    />
                    <span>Perfil</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      handleCloseMenu();
                    }}
                    className="block py-2 text-left transition hover:text-red-400 lg:py-0 lg:text-right"
                  >
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}

export default Navbar;
