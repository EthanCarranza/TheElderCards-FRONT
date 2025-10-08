import { useEffect, useState } from "react";
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
  creator: string | { _id: string; username?: string; email?: string };
  isPrivate?: boolean;
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
  const [form, setForm] = useState({ title: "", description: "", isPrivate: false });
  const [image, setImage] = useState<File | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", isPrivate: false });
  const [editImage, setEditImage] = useState<File | null>(null);
    const canCreate = !!user;


  const handleEdit = (collection: CollectionItem) => {
    setEditingCollection(collection._id);
    setEditForm({
      title: collection.title,
      isPrivate: collection.isPrivate || false
    });
    setEditImage(null);
  };

  const handleDelete = async (collectionId: string) => {
    if (!user || !confirm("¿Estás seguro de que quieres eliminar esta colección?")) return;
    
    try {
      await apiFetch(`/collections/${collectionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setCollections(prev => prev.filter(col => col._id !== collectionId));
    } catch (error) {
      console.error("Error al eliminar colección:", error);
      alert("Error al eliminar la colección");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingCollection) return;

    try {
      const formData = new FormData();
      formData.append("title", editForm.title.trim());
      formData.append("description", editForm.description.trim());
      formData.append("isPrivate", editForm.isPrivate.toString());
      
      if (editImage) {
        formData.append("img", editImage);
      }

      const response = await apiFetch<CollectionItem>(`/collections/${editingCollection}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });

      if (response.data) {
        setCollections(prev => 
          prev.map(col => col._id === editingCollection ? response.data! : col)
        );
        setEditingCollection(null);
        setEditForm({ title: "", description: "", isPrivate: false });
        setEditImage(null);
      }
    } catch (error) {
      console.error("Error al actualizar colección:", error);
      alert("Error al actualizar la colección");
    }
  };
  
  const getCreatorName = (creator: string | { _id: string; username?: string; email?: string }) => {
    if (typeof creator === "string") {
      return "Creador desconocido";
    }
    
    if (creator && typeof creator === "object") {
      return creator.username || creator.email || "Creador desconocido";
    }
    
    return "Creador desconocido";
  };
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const headers: Record<string, string> = user 
          ? { Authorization: `Bearer ${user.token}` }
          : {};
        const listResp = await apiFetch<CollectionItem[]>("/collections", { headers });
        setCollections(listResp.data || []);
      } catch (e: unknown) {
        setCollections([]);
        const msg = extractErrorMessage(e, "");
        if (msg && msg !== "No hay colecciones") setError(msg);
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
      fd.append("isPrivate", form.isPrivate.toString());
      if (image) fd.append("img", image);
      const resp = await apiFetch<CollectionItem>("/collections", {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCollections((prev) => [resp.data, ...prev]);
      setForm({ title: "", description: "", isPrivate: false });
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
            const creatorId = typeof col.creator === 'string' ? col.creator : col.creator._id;
            const isOwner = user?.userId && creatorId === user.userId;
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
                  <div className="mt-2 text-xs sm:text-sm text-gray-600 space-y-1">
                    <div>{col.cards?.length || 0} cartas</div>
                    {!col.isPrivate && (
                      <div className="text-gray-500">
                        Por: {getCreatorName(col.creator)}
                      </div>
                    )}
                    {col.isPrivate && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <span>🔒</span>
                        <span>Privada</span>
                      </div>
                    )}
                  </div>
                  {user && isOwner && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(col);
                        }}
                        className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(col._id);
                        }}
                        className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
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
                    setForm({ title: "", description: "", isPrivate: false });
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
              <div className="flex items-center gap-2">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={form.isPrivate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isPrivate: e.target.checked }))
                  }
                  className="rounded"
                />
                <label htmlFor="isPrivate" className="text-sm sm:text-base text-white">
                  Colección privada (solo tú puedes verla)
                </label>
              </div>
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

      {/* Modal de edición */}
      {editingCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-black">Editar Colección</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit-isPrivate"
                  type="checkbox"
                  checked={editForm.isPrivate}
                  onChange={(e) => setEditForm(f => ({ ...f, isPrivate: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="edit-isPrivate" className="text-sm text-gray-700">
                  Colección privada
                </label>
              </div>

              <div>
                <label htmlFor="edit-image" className="block text-sm font-medium text-gray-700">
                  Nueva imagen (opcional)
                </label>
                <input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCollection(null);
                    setEditForm({ title: "", description: "", isPrivate: false });
                    setEditImage(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
export default Collections;
