import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageLayout from "./PageLayout";
import { apiFetch } from "./api";
import { DEFAULT_PROFILE_IMAGE } from "../constants/user";
import { extractErrorMessage } from "../utils/errors";
import CardTile, { type CardTileData } from "./CardTile";

interface PublicUser {
  _id?: string;
  id?: string;
  username?: string;
  email?: string;
  image?: string;
}

interface CollectionSummary {
  _id: string;
  title: string;
  description?: string;
  img?: string;
  cards?: Array<string | { _id: string; title: string; img?: string }>;
}

interface CardsResponse {
  cards?: Array<{ _id: string; title: string; img?: string }>;
}

const UserPublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [cards, setCards] = useState<CardTileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!userId) {
        setError("Identificador de usuario no válido");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const usersResp = await apiFetch<PublicUser[]>("/users");
        const users = usersResp.data ?? [];
        const userData = users.find(
          (candidate) => candidate?._id === userId || candidate?.id === userId
        );

        if (!userData) {
          if (isActive) {
            setProfile(null);
            setCollections([]);
            setCards([]);
            setError("Usuario no encontrado");
          }
          return;
        }

        if (isActive) {
          setProfile(userData);
        }

        let collectionsData: CollectionSummary[] = [];
        try {
          const collectionsResp = await apiFetch<CollectionSummary[]>(
            `/collections/by/user/${userData._id ?? userData.id ?? userId}`
          );
          collectionsData = collectionsResp.data ?? [];
        } catch (collectionsError) {
          console.error(
            "Error al cargar las colecciones del usuario",
            collectionsError
          );
          collectionsData = [];
        }

        let cardsData: CardTileData[] = [];
        const creatorFilter = userData.username || userData.email;
        if (creatorFilter) {
          try {
            const cardsResp = await apiFetch<CardsResponse>(
              `/cards?creator=${encodeURIComponent(creatorFilter)}`
            );
            const fetchedCards = cardsResp.data?.cards ?? [];
            cardsData = fetchedCards.map((card) => ({
              _id: card._id,
              title: card.title,
              img: card.img,
            }));
          } catch (cardsError) {
            console.error("Error al cargar las cartas del usuario", cardsError);
            cardsData = [];
          }
        }

        if (isActive) {
          setCollections(collectionsData);
          setCards(cardsData);
        }
      } catch (loadError) {
        const message = extractErrorMessage(
          loadError,
          "No se pudo cargar la información del usuario"
        );
        console.error("Error al cargar el perfil público del usuario", loadError);
        if (isActive) {
          setError(message);
          setProfile(null);
          setCollections([]);
          setCards([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/cards");
    }
  };

  const displayName = useMemo(
    () => profile?.username ?? profile?.email ?? "Usuario",
    [profile?.username, profile?.email]
  );
  const avatar = useMemo(
    () => profile?.image || DEFAULT_PROFILE_IMAGE,
    [profile?.image]
  );

  return (
    <PageLayout contentClassName="flex-1 overflow-y-auto p-6">
      <button
        onClick={handleGoBack}
        className="mb-6 rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
        type="button"
      >
        Volver
      </button>

      {loading ? (
        <div className="text-white">Cargando perfil del creador...</div>
      ) : error ? (
        <div className="rounded border border-red-400 bg-red-500/20 p-4 text-red-100">
          {error}
        </div>
      ) : profile ? (
        <div className="mx-auto max-w-5xl space-y-10 text-white">
          <section className="flex flex-col items-center gap-6 rounded-lg bg-white/10 p-6 shadow-lg backdrop-blur-sm md:flex-row md:items-start">
            <img
              src={avatar}
              alt={`Avatar de ${displayName}`}
              className="h-32 w-32 rounded-full object-cover ring-4 ring-white/40"
              loading="lazy"
            />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-semibold">{displayName}</h1>
              {profile.username && (
                <p className="mt-2 text-sm text-white/70">@{profile.username}</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Colecciones</h2>
            {collections.length === 0 ? (
              <p className="mt-2 text-sm text-white/70">
                Este usuario aún no tiene colecciones públicas.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {collections.map((collection) => {
                  const cardsCount = Array.isArray(collection.cards)
                    ? collection.cards.length
                    : 0;
                  return (
                    <Link
                      key={collection._id}
                      to={`/collections/${collection._id}`}
                      className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/10 shadow transition hover:border-emerald-400/60"
                    >
                      {collection.img ? (
                        <img
                          src={collection.img}
                          alt={`Colección ${collection.title}`}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-slate-800 text-sm text-white/70">
                          Sin imagen
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="text-lg font-semibold text-white">
                          {collection.title}
                        </h3>
                        {collection.description && (
                          <p className="text-sm text-white/70">
                            {collection.description}
                          </p>
                        )}
                        <span className="text-xs text-white/50">
                          {cardsCount} cartas
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Cartas creadas</h2>
            {cards.length === 0 ? (
              <p className="mt-2 text-sm text-white/70">
                Este usuario todavía no ha creado cartas.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                  <CardTile key={card._id} card={card} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded border border-red-400 bg-red-500/20 p-4 text-red-100">
          No se pudo cargar la información del usuario.
        </div>
      )}
    </PageLayout>
  );
};

export default UserPublicProfile;
