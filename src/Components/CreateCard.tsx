import { useState } from "react";
import { apiFetch } from "./api";
import { CARD_TYPES } from "../constants/cardTypes";
import { extractErrorMessage } from "../utils/errors";

interface FactionOption {
  _id: string;
  title: string;
}
interface Props {
  onCreated?: () => void;
  factions: FactionOption[];
}

const CreateCard: React.FC<Props> = ({ onCreated, factions }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Creature",
    faction: "",
    cost: "",
    attack: "",
    defense: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tooltip, setTooltip] = useState<{ field: string; visible: boolean }>({
    field: "",
    visible: false,
  });

  const fieldHelp: Record<string, string> = {
    title:
      "El nombre de la carta. Máximo 20 caracteres. Debe ser único y descriptivo.",
    description: "Descripción larga de la carta. Máximo 100 caracteres.",
    type: "El tipo de carta: Criatura, Artefacto o Hechizo.",
    faction: "La facción a la que pertenece la carta.",
    cost: "Coste de jugar la carta (0-10).",
    attack: "Poder de ataque de la criatura (0-10). Solo para criaturas.",
    defense: "Defensa de la criatura (1-10). Solo para criaturas.",
    image: "Imagen de la carta. Formatos permitidos: JPG, PNG, GIF.",
  };
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
      type: inputType,
      files,
    } = e.target as HTMLInputElement;
    if (inputType === "file" && files) {
      setImage(files[0] || null);
      return;
    }
    if (name === "type") {
      setForm((prev) => ({
        ...prev,
        type: value,
        attack: "",
        defense: "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
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
      formData.append("type", form.type);
      formData.append("faction", form.faction);
      formData.append("cost", form.cost);
      if (form.type === "Creature") {
        formData.append("attack", form.attack);
        formData.append("defense", form.defense);
      }

      if (image) {
        console.log(image);
        console.log(image instanceof File);
        formData.append("img", image);
      }
      const token = localStorage.getItem("token");
      await apiFetch("/cards", {
        method: "POST",
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setSuccess("Carta creada correctamente");
      setForm({
        title: "",
        description: "",
        type: "Creature",
        faction: "",
        cost: "",
        attack: "",
        defense: "",
      });
      setImage(null);
      if (onCreated) onCreated();
    } catch (error: unknown) {
      setError(extractErrorMessage(error, "Error al crear carta"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 rounded p-6 mt-6 w-full max-w-lg mx-auto flex flex-col gap-4"
    >
      <h3 className="text-xl font-bold text-white mb-2">Crear nueva carta</h3>
      <div className="relative flex items-center">
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Título"
          className="p-2 rounded flex-1"
          required
          maxLength={20}
        />
        <span
          className="ml-2 text-blue-400 text-lg select-none cursor-pointer"
          onMouseEnter={() => setTooltip({ field: "title", visible: true })}
          onMouseLeave={() => setTooltip({ field: "", visible: false })}
        >
          &#x2753;
        </span>
        {tooltip.visible && tooltip.field === "title" && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded p-2 shadow-lg z-10 w-64">
            {fieldHelp.title}
          </div>
        )}
      </div>
      <div className="relative flex items-center">
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="p-2 rounded flex-1"
          required
        >
          {CARD_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <span
          className="ml-2 text-blue-400 text-lg select-none cursor-pointer"
          onMouseEnter={() => setTooltip({ field: "type", visible: true })}
          onMouseLeave={() => setTooltip({ field: "", visible: false })}
        >
          &#x2753;
        </span>
        {tooltip.visible && tooltip.field === "type" && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded p-2 shadow-lg z-10 w-64">
            {fieldHelp.type}
          </div>
        )}
      </div>
      <div className="relative flex items-center">
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Descripción"
          className="p-2 rounded flex-1 resize-none"
          required
          maxLength={100}
          rows={2}
        />
        <span
          className="ml-2 text-blue-400 text-lg select-none cursor-pointer"
          onMouseEnter={() =>
            setTooltip({ field: "description", visible: true })
          }
          onMouseLeave={() => setTooltip({ field: "", visible: false })}
        >
          &#x2753;
        </span>
        {tooltip.visible && tooltip.field === "description" && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded p-2 shadow-lg z-10 w-64">
            {fieldHelp.description}
          </div>
        )}
      </div>
      <div className="relative flex items-center">
        <select
          name="faction"
          value={form.faction}
          onChange={handleChange}
          className="p-2 rounded flex-1"
          required
          disabled={factions.length === 0}
        >
          <option value="">
            {factions.length === 0 ? "No hay facciones disponibles" : "Facción"}
          </option>
          {factions.map((f) => (
            <option key={f._id} value={f._id}>
              {f.title}
            </option>
          ))}
        </select>
        <span
          className="ml-2 text-blue-400 text-lg select-none cursor-pointer"
          onMouseEnter={() => setTooltip({ field: "faction", visible: true })}
          onMouseLeave={() => setTooltip({ field: "", visible: false })}
        >
          &#x2753;
        </span>
        {tooltip.visible && tooltip.field === "faction" && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded p-2 shadow-lg z-10 w-64">
            {fieldHelp.faction}
          </div>
        )}
      </div>
      <div className="relative flex items-center">
        <input
          name="cost"
          type="number"
          min={0}
          max={10}
          value={form.cost}
          onChange={handleChange}
          placeholder="Coste"
          className="p-2 rounded flex-1"
          required
        />
        <span
          className="ml-2 text-blue-400 text-lg select-none cursor-pointer"
          onMouseEnter={() => setTooltip({ field: "cost", visible: true })}
          onMouseLeave={() => setTooltip({ field: "", visible: false })}
        >
          &#x2753;
        </span>
        {tooltip.visible && tooltip.field === "cost" && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded p-2 shadow-lg z-10 w-64">
            {fieldHelp.cost}
          </div>
        )}
      </div>
      {form.type === "Creature" && (
        <div className="flex gap-4">
          <div className="relative flex-1 flex items-center">
            <input
              name="attack"
              type="number"
              min={0}
              max={10}
              value={form.attack}
              onChange={handleChange}
              placeholder="Ataque"
              className="p-2 rounded w-full"
              required
            />
            <span
              className="ml-2 text-blue-400 text-lg select-none cursor-pointer"
              onMouseEnter={() =>
                setTooltip({ field: "attack", visible: true })
              }
              onMouseLeave={() => setTooltip({ field: "", visible: false })}
            >
              &#x2753;
            </span>
            {tooltip.visible && tooltip.field === "attack" && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded p-2 shadow-lg z-10 w-64">
                {fieldHelp.attack}
              </div>
            )}
          </div>
          <div className="relative flex-1 flex items-center">
            <input
              name="defense"
              type="number"
              min={1}
              max={10}
              value={form.defense}
              onChange={handleChange}
              placeholder="Defensa"
              className="p-2 rounded w-full"
              required
            />
            <span
              className="ml-2 text-blue-400 text-lg select-none cursor-pointer"
              onMouseEnter={() =>
                setTooltip({ field: "defense", visible: true })
              }
              onMouseLeave={() => setTooltip({ field: "", visible: false })}
            >
              &#x2753;
            </span>
            {tooltip.visible && tooltip.field === "defense" && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded p-2 shadow-lg z-10 w-64">
                {fieldHelp.defense}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="relative flex items-center">
        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="p-2 rounded flex-1 bg-gray-700 text-white"
          required
        />
        <span
          className="ml-2 text-blue-400 text-lg select-none cursor-pointer"
          onMouseEnter={() => setTooltip({ field: "image", visible: true })}
          onMouseLeave={() => setTooltip({ field: "", visible: false })}
        >
          &#x2753;
        </span>
        {tooltip.visible && tooltip.field === "image" && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded p-2 shadow-lg z-10 w-64">
            {fieldHelp.image}
          </div>
        )}
      </div>
      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Creando..." : "Crear carta"}
      </button>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">{success}</div>}
    </form>
  );
};

export default CreateCard;
