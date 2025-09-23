import { useState, useEffect } from "react";
import { apiFetch } from "./api";
import { useAuth } from "../contexts/AuthContext"; // Importing useAuth
import SideBanner from "./SideBanner";
import Navbar from "./Navbar";
import Footer from "./Footer";

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
      } catch (err: any) {
        setError("Error al cargar facciones");
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
    <div className="relative min-h-screen bg-cover bg-center">
      <div className="flex">
        <SideBanner image="/bg.webp" position="left" />
        <div className="w-4/6 bg-black bg-opacity-90 min-h-screen flex flex-col">
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
                      {expanded === f._id
                        ? "Ocultar descripción"
                        : "Ver descripción"}
                    </button>
                    {expanded === f._id && (
                      <div className="mt-1 text-gray-300 bg-gray-900 rounded p-2 w-full">
                        <div className="mb-1 font-bold">Descripción:</div>
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
                Crear facción
              </button>
            )}
            {isAdmin && showCreate && (
              <>
                <button
                  className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  onClick={() => setShowCreate(false)}
                  type="button"
                >
                  ← Volver al listado
                </button>
                <CreateFactionForm
                  onCreated={async () => {
                    setShowCreate(false);
                    setLoading(true);
                    setError("");
                    try {
                      const response = await apiFetch("/factions");
                      setFactions(response.data);
                    } catch (err: any) {
                      setError("Error al cargar facciones");
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              </>
            )}
          </div>
          <Footer />
        </div>
        <SideBanner image="/bg.webp" position="right" />
      </div>
    </div>
  );
};

function CreateFactionForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    territory: "",
    color: "",
  });
  const [img, setImg] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const {
      name,
      value,
      type: inputType,
      files,
    } = e.target as HTMLInputElement;
    if (inputType === "file" && files) {
      setImg(files[0] || null);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("territory", form.territory);
      formData.append("color", form.color);
      if (img) {
        formData.append("img", img);
      }
      await apiFetch("/factions", {
        method: "POST",
        data: formData,
        headers: {
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      });
      setSuccess("Facción creada correctamente");
      setForm({ title: "", description: "", territory: "", color: "" });
      setImg(null);
      if (onCreated) onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al crear facción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 rounded p-6 mt-6 w-full max-w-lg mx-auto flex flex-col gap-4"
    >
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Nombre de la facción"
        className="p-2 rounded"
        required
        maxLength={20}
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Descripción"
        className="p-2 rounded resize-none"
        required
        rows={4}
      />
      <input
        name="territory"
        value={form.territory}
        onChange={handleChange}
        placeholder="Territorio"
        className="p-2 rounded"
        required
        maxLength={30}
      />
      <label className="flex items-center gap-2">
        <span className="text-white">Color principal:</span>
        <input
          name="color"
          type="color"
          value={form.color || "#000000"}
          onChange={handleChange}
          className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
          required
        />
        <span className="text-xs text-gray-300 ml-2">{form.color}</span>
      </label>
      <input
        name="img"
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="p-2 rounded bg-gray-700 text-white"
      />
      {img && <span className="ml-2 text-green-400 text-xs">{img.name}</span>}
      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Creando..." : "Crear facción"}
      </button>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">{success}</div>}
    </form>
  );
}

export default Factions;
