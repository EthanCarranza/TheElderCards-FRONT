import { useState, useEffect } from "react";
import { apiFetch } from "./api";
import { extractErrorMessage } from "../utils/errors";
import { useAuth } from "../contexts/AuthContext"; // Importing useAuth
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageLayout from "./PageLayout";

interface Faction {
  _id: string;
  title: string;
  description: string;
  territory: string;
  color: string;
}

const Factions: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchFactions = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch("/factions");
        setFactions(response.data);
      } catch (error: unknown) {
        setError(extractErrorMessage(error, "Error al cargar facciones"));
      } finally {
        setLoading(false);
      }
    };
    fetchFactions();
  }, []);

  const handleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <PageLayout>
      <Navbar />
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-xl font-bold text-white mb-2">Facciones</h3>
        {showCreate ? null : loading ? (
          <div className="text-white">Cargando...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : factions.length === 0 ? (
          <div className="text-gray-400">No hay facciones disponibles</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {factions.map((f) => (
              <div
                key={f._id}
                className="bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-start border-2 border-gray-700 hover:border-green-500 transition-all relative"
              >
                <div className="flex items-center gap-2 mb-2 w-full">
                  <span
                    className="inline-block w-5 h-5 border border-gray-400"
                    style={{ backgroundColor: f.color }}
                    title={f.color}
                  ></span>
                  <span className="text-lg font-bold text-white">
                    {f.title}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    ({f.territory})
                  </span>
                </div>
                <button
                  className="text-green-400 text-xs underline mb-1 self-end"
                  onClick={() => handleExpand(f._id)}
                >
                  {expanded === f._id ? "Ocultar descripci��n" : "Ver descripci��n"}
                </button>
                {expanded === f._id && (
                  <div className="mt-1 text-gray-300 bg-gray-900 rounded p-2 w-full">
                    <div className="mb-1 font-bold">Descripci��n:</div>
                    <div>{f.description}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {isAdmin && !showCreate && (
          <button
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            onClick={() => setShowCreate(true)}
          >
            Crear facci��n
          </button>
        )}
        {isAdmin && showCreate && (
          <>
            <button
              className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              onClick={() => setShowCreate(false)}
              type="button"
            >
              ��? Volver al listado
            </button>
            <CreateFactionForm
              onCreated={async () => {
                setShowCreate(false);
                setLoading(true);
                setError("");
                try {
                  const response = await apiFetch("/factions");
                  setFactions(response.data);
                } catch (error: unknown) {
                  setError(extractErrorMessage(error, "Error al cargar facciones"));
                } finally {
                  setLoading(false);
                }
              }}
            />
          </>
        )}
      </div>
      <Footer />
    </PageLayout>
  );
}

export default Factions;
