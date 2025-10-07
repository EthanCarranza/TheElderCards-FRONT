import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "./PageLayout";
import { apiFetch } from "./api";
import { useAuth } from "../hooks/useAuth";
import { extractErrorMessage } from "../utils/errors";
interface CollectionItem {
  _id: string;
  title: string;
  description?: string;
  img?: string;
  creator: string;
  cards: Array<{ _id: string; title: string; img?: string }>;
}
const Collections: React.FC = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [form, setForm] = useState({ title: "", description: "" });
  const [image, setImage] = useState<File | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const canCreate = useMemo(() => Boolean(user), [user]);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const listResp = await apiFetch<CollectionItem[]>("/collections");
        setCollections(listResp.data || []);
      } catch (e: unknown) {
        setCollections([]);
        const msg = extractErrorMessage(e, "");
        if (msg) setError(msg);
      } finally {
        setLoading(false);
      }
      if (user) {
        try {
          const favResp = await apiFetch<CollectionItem[]>(
            "/collections/favorites/mine",
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
          setFavorites((favResp.data || []).map((c) => c._id));
        } catch {
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    };
    void load();
  }, [user]);
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setCreating(true);
    try {
      if (!user) throw new Error("Debes iniciar sesión");
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      if (image) fd.append("img", image);
      const resp = await apiFetch<CollectionItem>("/collections", {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCollections((prev) => [resp.data, ...prev]);
      setForm({ title: "", description: "" });
      setImage(null);
      setCreateSuccess("Colección creada");
      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess("");
      }, 2000);
    } catch (e: unknown) {
      setCreateError(extractErrorMessage(e, "Error al crear colección"));
    } finally {
      setCreating(false);
    }
  };
  const toggleFavorite = async (collectionId: string, isFav: boolean) => {
    if (!user) return;
    try {
      if (!isFav) {
        await apiFetch(`/collections/${collectionId}/favorite`, {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFavorites((prev) => [...prev, collectionId]);
      } else {
        await apiFetch(`/collections/${collectionId}/favorite`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFavorites((prev) => prev.filter((id) => id !== collectionId));
      }
    } catch {
      setError("Error al gestionar favoritos");
    }
  };
  return (
    <PageLayout contentClassName="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 xl:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-3xl font-bold mb-2 sm:mb-0">Colecciones</h1>
      </div>
      {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
      {loading ? (
        <div>Cargando colecciones...</div>
      ) : collections.length === 0 ? (
        <div>No hay colecciones</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
          {collections.map((col) => {
            const isFav = favorites.includes(col._id);
            const isOwner = user?.userId && col.creator === user.userId;
            return (
              <Link
                key={col._id}
                to={`/collections/${col._id}`}
                className="group block rounded bg-white/90 text-black shadow p-3 relative hover:shadow-lg transition"
                aria-label={`Abrir colección ${col.title}`}
              >
                <div className="relative">
                  {col.img ? (
                    <img
                      src={col.img}
                      alt={col.title}
                      className="w-full h-32 sm:h-36 lg:h-40 xl:h-48 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-32 sm:h-36 lg:h-40 xl:h-48 bg-gray-200 rounded flex items-center justify-center text-gray-600 text-sm">
                      Sin imagen
                    </div>
                  )}
                  {user && !isOwner && (
                    <button
                      title={
                        isFav ? "Quitar de favoritos" : "Marcar como favorito"
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void toggleFavorite(col._id, isFav);
                      }}
                      className={`absolute top-2 right-2 rounded-full p-1.5 sm:p-2 text-sm ${
                        isFav
                          ? "bg-yellow-400 text-black"
                          : "bg-black/60 text-white"
                      }`}
                    >
                      ★
                    </button>
                  )}
                </div>
                <div className="mt-2">
                  <div className="font-semibold group-hover:underline text-sm sm:text-base lg:text-lg break-words">
                    {col.title}
                  </div>
                  {col.description && (
                    <div className="text-xs sm:text-sm lg:text-base text-gray-700 line-clamp-2 break-words">
                      {col.description}
                    </div>
                  )}
                  <div className="mt-2 text-xs sm:text-sm text-gray-600">
                    {col.cards?.length || 0} cartas
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {canCreate && (
        <div className="mt-6 sm:mt-8 flex flex-col items-center">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded bg-gray-600 hover:bg-gray-700 px-6 py-3 font-semibold text-white transition-colors text-sm sm:text-base"
            >
              Crear Colección
            </button>
          ) : (
            <form
              onSubmit={handleCreate}
              className="bg-gray-700 p-4 sm:p-6 rounded text-white flex flex-col gap-3 sm:gap-4 w-full max-w-md mx-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl sm:text-2xl font-semibold">
                  Crear colección
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setForm({ title: "", description: "" });
                    setImage(null);
                    setCreateError("");
                    setCreateSuccess("");
                  }}
                  className="text-gray-300 hover:text-white text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <input
                className="p-2 sm:p-3 rounded text-black text-sm sm:text-base"
                placeholder="Nombre de la colección"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                maxLength={60}
              />
              <textarea
                className="p-2 sm:p-3 rounded text-black text-sm sm:text-base"
                placeholder="Descripción"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
              <input
                type="file"
                accept="image/*"
                className="text-xs sm:text-sm"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-400 disabled:opacity-60 text-sm sm:text-base w-full"
                >
                  {creating ? "Creando..." : "Crear colección"}
                </button>
                {createSuccess && (
                  <span className="text-green-400 text-sm text-center">
                    {createSuccess}
                  </span>
                )}
                {createError && (
                  <span className="text-red-400 text-sm text-center break-words">
                    {createError}
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </PageLayout>
  );
};
export default Collections;
