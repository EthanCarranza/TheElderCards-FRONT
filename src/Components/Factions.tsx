import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from "react";
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
        <h3 className="mb-2 text-xl font-bold text-white">Facciones</h3>
        {showCreate ? null : loading ? (
          <div className="text-white">Cargando...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : factions.length === 0 ? (
          <div className="text-gray-400">No hay facciones disponibles</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {factions.map((factionItem) => (
              <div
                key={factionItem._id}
                className="relative flex flex-col items-start rounded-lg border-2 border-gray-700 bg-gray-800 p-4 shadow-lg transition-all hover:border-green-500"
              >
                {factionItem.img && (
                  <img
                    src={factionItem.img}
                    alt={`Imagen de ${factionItem.title}`}
                    className="mb-3 h-40 w-full rounded-md object-cover"
                    loading="lazy"
                  />
                )}
                <div className="mb-2 flex w-full items-center gap-2">
                  <span
                    className="inline-block h-5 w-5 border border-gray-400"
                    style={{ backgroundColor: factionItem.color }}
                    title={factionItem.color}
                  ></span>
                  <span className="text-lg font-bold text-white">
                    {factionItem.title}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    ({factionItem.territory})
                  </span>
                </div>
                <button
                  className="self-end text-xs text-green-400 underline"
                  onClick={() => handleExpand(factionItem._id)}
                  type="button"
                >
                  {expanded === factionItem._id ? "Ocultar descripcion" : "Ver descripcion"}
                </button>
                {expanded === factionItem._id && (
                  <div className="mt-1 w-full rounded bg-gray-900 p-2 text-gray-300">
                    <div className="mb-1 font-bold">Descripcion:</div>
                    <div>{factionItem.description}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {isAdmin && !showCreate && (
          <button
            className="mt-4 rounded bg-green-600 px-4 py-2 font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            onClick={() => setShowCreate(true)}
            type="button"
          >
            Crear faccion
          </button>
        )}
        {isAdmin && showCreate && (
          <div className="mt-6 space-y-4">
            <button
              className="rounded bg-gray-600 px-4 py-2 font-bold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
              onClick={() => setShowCreate(false)}
              type="button"
            >
              Volver al listado
            </button>
            <CreateFactionForm
              onCreated={async () => {
                await fetchFactions();
                setShowCreate(false);
              }}
            />
          </div>
        )}
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
      className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded bg-gray-800 p-6"
    >
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Nombre de la faccion"
        className="rounded p-2"
        required
        maxLength={40}
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Descripcion"
        className="h-32 resize-none rounded p-2"
        required
      />
      <input
        name="territory"
        value={form.territory}
        onChange={handleChange}
        placeholder="Territorio"
        className="rounded p-2"
        required
        maxLength={40}
      />
      <label className="flex items-center gap-2 text-white">
        <span>Color principal:</span>
        <input
          name="color"
          type="color"
          value={form.color}
          onChange={handleChange}
          className="h-10 w-10 cursor-pointer rounded border border-gray-600 bg-transparent p-0"
          required
        />
        <span className="text-xs text-gray-300">{form.color}</span>
      </label>
      <input
        name="img"
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="rounded bg-gray-700 p-2 text-white"
      />
      {img && <span className="text-xs text-green-400">{img.name}</span>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {success && <div className="text-sm text-green-500">{success}</div>}
      <button
        type="submit"
        className="rounded bg-green-600 px-4 py-2 font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Creando..." : "Crear faccion"}
      </button>
    </form>
  );
};

export default Factions;

