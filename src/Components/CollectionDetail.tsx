import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "./PageLayout";
import { apiFetch } from "./api";
import { extractErrorMessage } from "../utils/errors";
import { useAuth } from "../hooks/useAuth";
import CardTile from "./CardTile";
interface CardItem {
  _id: string;
  title: string;
  img?: string;
}
interface CollectionDetailData {
  _id: string;
  title: string;
  description?: string;
  img?: string;
  creator: string;
  cards: CardItem[];
  isPrivate?: boolean;
}

interface CollectionStats {
  likes: number;
  favorites: number;
}

interface CollectionInteraction {
  liked: boolean;
  favorited: boolean;
}
const CollectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collection, setCollection] = useState<CollectionDetailData | null>(
    null
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const [collectionStats, setCollectionStats] = useState<CollectionStats>({
    likes: 0,
    favorites: 0,
  });
  const [collectionInteraction, setCollectionInteraction] =
    useState<CollectionInteraction>({
      liked: false,
      favorited: false,
    });
  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Identificador de colección no válido");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const headers: Record<string, string> = user
          ? { Authorization: `Bearer ${user.token}` }
          : {};
        const resp = await apiFetch<CollectionDetailData>(
          `/collections/${id}`,
          { headers }
        );
        setCollection(resp.data);

        const isUserPrivateCollection =
          resp.data.isPrivate && user && resp.data.creator === user.userId;

        if (!isUserPrivateCollection) {
          try {
            const statsResp = await apiFetch<CollectionStats>(
              `/collections/${id}/stats`
            );
            setCollectionStats(statsResp.data);
          } catch {
            setCollectionStats({ likes: 0, favorites: 0 });
          }
        } else {
          setCollectionStats({ likes: 0, favorites: 0 });
        }

        if (user) {
          if (!isUserPrivateCollection) {
            try {
              const favResp = await apiFetch<CollectionDetailData[]>(
                "/collections/favorites/mine",
                {
                  headers: { Authorization: `Bearer ${user.token}` },
                }
              );
              const favorites = (favResp.data || []).map((c) => c._id);
              setIsFavorite(favorites.includes(id));
            } catch {
              setIsFavorite(false);
            }

            try {
              const interactionResp = await apiFetch<CollectionInteraction>(
                `/collections/${id}/interaction`,
                {
                  headers: { Authorization: `Bearer ${user.token}` },
                }
              );
              setCollectionInteraction(interactionResp.data);
            } catch {
              setCollectionInteraction({ liked: false, favorited: false });
            }
          } else {
            setIsFavorite(false);
            setCollectionInteraction({ liked: false, favorited: false });
          }
        }
      } catch (e: unknown) {
        setError(extractErrorMessage(e, "No se pudo cargar la colección"));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user || !id) return;

    try {
      const response = await apiFetch<{
        favorited: boolean;
        stats: CollectionStats;
      }>(`/collections/${id}/favorite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setIsFavorite(response.data.favorited);
      setCollectionStats(response.data.stats);
      setCollectionInteraction((prev) => ({
        ...prev,
        favorited: response.data.favorited,
      }));
    } catch {
      setError("Error al gestionar favoritos");
    }
  };

  const toggleLike = async () => {
    if (!user || !id) return;

    try {
      const response = await apiFetch<{
        liked: boolean;
        stats: CollectionStats;
      }>(`/collections/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setCollectionInteraction((prev) => ({
        ...prev,
        liked: response.data.liked,
      }));
      setCollectionStats(response.data.stats);
    } catch {
      setError("Error al gestionar me gusta");
    }
  };

  // Obtener el ID del creador, sea string o sea objeto
  type CreatorType = string | { _id: string } | null | undefined;
  const getCreatorId = (creator: CreatorType) => {
    if (!creator) return "";
    if (typeof creator === "string") return creator;
    if (typeof creator === "object" && creator._id) return creator._id;
    return String(creator);
  };

  const isPrivateCollection = () => {
    if (!collection || !user) return false;
    return (
      collection.isPrivate &&
      getCreatorId(collection.creator) === String(user.userId)
    );
  };

  const shouldShowPublicInteractions = () => {
    if (!collection || !user) return false;
    return (
      !collection.isPrivate &&
      getCreatorId(collection.creator) !== String(user.userId)
    );
  };
  return (
    <PageLayout contentClassName="flex-1 overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
        <button
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/collections")
          }
          className="mb-6 rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
        >
          Volver
        </button>
        {loading ? (
          <div className="text-white text-center py-8">
            Cargando colección...
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-4 px-4 bg-red-100 rounded-lg">
            {error}
          </div>
        ) : collection ? (
          <div className="space-y-6 lg:space-y-8">
            <div className="bg-white/90 text-black rounded-lg p-4 lg:p-6 shadow-lg relative">
              {collection.img ? (
                <img
                  src={collection.img}
                  alt={collection.title}
                  className="w-full max-h-[300px] sm:max-h-[400px] lg:max-h-[420px] object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 sm:h-56 lg:h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600">
                  Sin imagen
                </div>
              )}
              <div className="flex items-center justify-between mt-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words flex-1">
                  {collection.title}
                </h1>
                {shouldShowPublicInteractions() && (
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={toggleLike}
                      title={
                        collectionInteraction.liked
                          ? "Quitar me gusta"
                          : "Me gusta"
                      }
                      className={`rounded-full p-2 lg:p-3 text-lg lg:text-xl transition-colors ${
                        collectionInteraction.liked
                          ? "bg-red-400 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      ❤️
                    </button>
                    <button
                      onClick={toggleFavorite}
                      title={
                        isFavorite
                          ? "Quitar de favoritos"
                          : "Marcar como favorito"
                      }
                      className={`rounded-full p-2 lg:p-3 text-lg lg:text-xl transition-colors ${
                        isFavorite
                          ? "bg-yellow-400 text-black"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      ⭐
                    </button>
                  </div>
                )}
              </div>
              {collection.description && (
                <p className="mt-2 text-sm sm:text-base lg:text-lg text-gray-800 whitespace-pre-line break-words">
                  {collection.description}
                </p>
              )}

              <div className="mt-4 flex gap-6 text-gray-600">
                {!isPrivateCollection() && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">❤️</span>
                      <span className="text-sm sm:text-base font-medium">
                        {collectionStats.likes} me gusta
                        {collectionStats.likes !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <span className="text-sm sm:text-base font-medium">
                        {collectionStats.favorites} favorito
                        {collectionStats.favorites !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <span className="text-sm sm:text-base font-medium">
                    {collection.cards?.length || 0} carta
                    {(collection.cards?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                {isPrivateCollection() && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔒</span>
                    <span className="text-sm sm:text-base font-medium text-gray-500">
                      Colección privada
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-4 lg:mb-6 text-white">
                Cartas ({collection.cards?.length || 0})
              </h2>
              {collection.cards?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                  {collection.cards.map((card) => (
                    <div key={card._id} className="w-full">
                      <CardTile card={card} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/90 text-center py-12 text-lg">
                  No hay cartas en esta colección
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-white text-center py-8">
            Colección no encontrada
          </div>
        )}
      </div>
    </PageLayout>
  );
};
export default CollectionDetail;
