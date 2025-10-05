import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "./api";
import { extractErrorMessage } from "../utils/errors";
import { useAuth } from "../contexts/AuthContext";
import PageLayout from "./PageLayout";

interface Faction {
  _id: string;
  title: string;
  description: string;
  territory: string;
  color: string;
  img?: string;
}

const Factions = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchFactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<Faction[]>("/factions");
      setFactions(response.data ?? []);
    } catch (fetchError: unknown) {
      setError(extractErrorMessage(fetchError, "Error al cargar facciones"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFactions();
  }, [fetchFactions]);

  const handleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <PageLayout contentClassName="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <h3 className="mb-6 text-3xl lg:text-4xl font-bold text-white text-center">
          Facciones
        </h3>
        {showCreate ? null : loading ? (
          <div className="text-white text-center">Cargando...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : factions.length === 0 ? (
          <div className="text-gray-400 text-center">
            No hay facciones disponibles
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 justify-items-center">
            {factions.map((factionItem) => (
              <div
                key={factionItem._id}
                className="relative flex flex-col items-start rounded-lg border-2 border-gray-700 bg-gray-800 p-6 shadow-lg transition-all hover:border-green-500 w-full max-w-md"
              >
                {factionItem.img && (
                  <img
                    src={factionItem.img}
                    alt={`Imagen de ${factionItem.title}`}
                    className="mb-4 h-48 w-full rounded-lg object-cover shadow-md"
                    loading="lazy"
                  />
                )}
                <div className="mb-4 flex w-full items-center gap-3">
                  <span
                    className="inline-block h-6 w-6 rounded-full border-2 border-gray-400 shadow-sm"
                    style={{ backgroundColor: factionItem.color }}
                    title={factionItem.color}
                  ></span>
                  <div className="flex-1">
                    <div className="text-xl font-bold text-white">
                      {factionItem.title}
                    </div>
                    <div className="text-sm text-gray-300">
                      {factionItem.territory}
                    </div>
                  </div>
                </div>
                <button
                  className="self-center mb-2 rounded-lg bg-green-600/20 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30 hover:text-green-300"
                  onClick={() => handleExpand(factionItem._id)}
                  type="button"
                >
                  {expanded === factionItem._id
                    ? "Ocultar descripción"
                    : "Ver descripción"}
                </button>
                {expanded === factionItem._id && (
                  <div className="mt-3 w-full rounded-lg bg-gray-900/50 p-4 text-gray-200 border border-gray-600">
                    <div className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">
                      Descripción:
                    </div>
                    <div className="leading-relaxed">
                      {factionItem.description}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {isAdmin && !showCreate && (
          <div className="mt-8 text-center">
            <button
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 shadow-lg"
              onClick={() => setShowCreate(true)}
              type="button"
            >
              Crear facción
            </button>
          </div>
        )}
        {isAdmin && showCreate && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <button
                className="rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                onClick={() => setShowCreate(false)}
                type="button"
              >
                ← Volver al listado
              </button>
            </div>
            <CreateFactionForm
              onCreated={async () => {
                await fetchFactions();
                setShowCreate(false);
              }}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

interface CreateFactionFormProps {
  onCreated: () => Promise<void> | void;
}

const CreateFactionForm = ({ onCreated }: CreateFactionFormProps) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    territory: "",
    color: "#000000",
  });
  const [img, setImg] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files, type } = event.target as HTMLInputElement;
    if (type === "file") {
      setImg(files && files[0] ? files[0] : null);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

      const headers = user?.token
        ? { Authorization: `Bearer ${user.token}` }
        : undefined;

      await apiFetch("/factions", {
        method: "POST",
        body: formData,
        headers,
      });

      setSuccess("Faccion creada correctamente");
      setForm({ title: "", description: "", territory: "", color: "#000000" });
      setImg(null);
      await onCreated();
    } catch (submitError: unknown) {
      setError(extractErrorMessage(submitError, "Error al crear faccion"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-lg bg-gray-800 p-6 shadow-lg border border-gray-700"
    >
      <h4 className="text-xl font-semibold text-white text-center">
        Nueva Facción
      </h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nombre de la facción
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ej: Imperio de Cyrodiil"
            className="w-full rounded-lg p-3 border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
            maxLength={40}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Territorio
          </label>
          <input
            name="territory"
            value={form.territory}
            onChange={handleChange}
            placeholder="Ej: Cyrodiil"
            className="w-full rounded-lg p-3 border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
            maxLength={40}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe la facción, su historia y características..."
            className="w-full h-32 resize-none rounded-lg p-3 border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Color principal
          </label>
          <div className="flex items-center gap-3">
            <input
              name="color"
              type="color"
              value={form.color}
              onChange={handleChange}
              className="h-12 w-16 cursor-pointer rounded-lg border border-gray-600 bg-transparent"
              required
            />
            <span className="text-gray-300 font-mono text-sm bg-gray-700 px-3 py-2 rounded">
              {form.color}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Imagen (opcional)
          </label>
          <input
            name="img"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="w-full rounded-lg bg-gray-700 p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700"
          />
          {img && (
            <span className="text-sm text-green-400 mt-2 block">
              📁 {img.name}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-600 rounded p-3">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-400 bg-green-900/20 border border-green-600 rounded p-3">
          {success}
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? "Creando..." : "Crear facción"}
      </button>
    </form>
  );
};

export default Factions;
