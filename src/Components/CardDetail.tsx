import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageLayout from "./PageLayout";
import { apiFetch } from "./api";
import { extractErrorMessage } from "../utils/errors";
import { useAuth } from "../contexts/AuthContext";
import { DEFAULT_PROFILE_IMAGE } from "../constants/user";
import {
  handleCardBlur,
  handleCardFocus,
  handleCardPointerLeave,
  handleCardPointerMove,
} from "../utils/card3d";

interface Faction {
  _id: string;
  title: string;
  description: string;
  territory: string;
  color: string;
}

interface CardDetailData {
  _id: string;
  title: string;
  description: string;
  type: string;
  faction: string | Faction;
  creator: string;
  cost: number;
  img?: string;
  attack?: number;
  defense?: number;
  date?: string;
}

interface CreatorSummary {
  _id?: string;
  id?: string;
  username?: string;
  email?: string;
  image?: string;
}

interface CardDetailLocationState {
  card?: Partial<CardDetailData> & { _id: string };
  faction?: Faction;
}

const buildCardFromState = (
  stateCard?: Partial<CardDetailData> & { _id: string }
): CardDetailData | null => {
  if (!stateCard) return null;
  return {
    _id: stateCard._id,
    title: stateCard.title ?? "",
    description: stateCard.description ?? "",
    type: stateCard.type ?? "",
    faction: stateCard.faction ?? "",
    creator: stateCard.creator ?? "",
    cost: stateCard.cost ?? 0,
    img: stateCard.img,
    attack: stateCard.attack,
    defense: stateCard.defense,
    date: stateCard.date,
  };
};

const CardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const locationState =
    (location.state as CardDetailLocationState | undefined) ?? {};
  const stateCard = locationState.card;
  const initialCard = buildCardFromState(stateCard);
  const initialFaction: Faction | null =
    locationState.faction ??
    (initialCard && typeof initialCard.faction === "object"
      ? (initialCard.faction as Faction)
      : null);
  const hasPrefetchedCard = Boolean(initialCard);

  const [card, setCard] = useState<CardDetailData | null>(initialCard);
  const [faction, setFaction] = useState<Faction | null>(initialFaction);
  const [loading, setLoading] = useState(!hasPrefetchedCard);
  const [error, setError] = useState("");

  // Mis colecciones (para añadir cartas)
  interface MyCollectionOption {
    _id: string;
    title: string;
    cards?: Array<string | { _id: string }>;
  }
  const [myCollections, setMyCollections] = useState<MyCollectionOption[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [creatorInfo, setCreatorInfo] = useState<CreatorSummary | null>(null);
  const [creatorLoading, setCreatorLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Identificador de carta no válido");
        setLoading(false);
        return;
      }

      if (!hasPrefetchedCard) {
        setLoading(true);
      }

      try {
        const response = await apiFetch<CardDetailData>(`/cards/${id}`);
        const cardData = response.data;
        setCard(cardData);

        if (cardData?.faction && typeof cardData.faction === "object") {
          setFaction(cardData.faction as Faction);
        } else if (cardData?.faction) {
          try {
            const factionResponse = await apiFetch<Faction>(
              `/factions/${cardData.faction}`
            );
            setFaction(factionResponse.data ?? null);
          } catch (fetchFactionError: unknown) {
            console.error("Error al cargar la faccion", fetchFactionError);
            setFaction(null);
          }
        } else {
          setFaction(null);
        }
        setError("");
      } catch (fetchError: unknown) {
        console.error("Error al cargar la carta", fetchError);
        setError(extractErrorMessage(fetchError, "Error al cargar la carta"));
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id, hasPrefetchedCard]);

  // Cargar colecciones del usuario autenticado
  useEffect(() => {
    const loadMyCollections = async () => {
      if (!user) {
        setMyCollections([]);
        return;
      }
      try {
        const resp = await apiFetch<MyCollectionOption[]>("/collections/mine", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setMyCollections(resp.data || []);
      } catch (fetchError) {
        console.error("Error al cargar las colecciones del usuario", fetchError);
        setMyCollections([]);
      }
    };
    void loadMyCollections();
  }, [user]);

  useEffect(() => {
    let isActive = true;

    const loadCreatorInfo = async () => {
      if (!card?.creator) {
        if (isActive) {
          setCreatorInfo(null);
          setCreatorLoading(false);
        }
        return;
      }

      setCreatorLoading(true);
      try {
        const response = await apiFetch<CreatorSummary[]>("/users");
        const users = response.data ?? [];
        const normalizedCreator = card.creator.toLowerCase();
        const found = users.find((candidate) => {
          const candidateUsername = candidate.username?.toLowerCase();
          const candidateEmail = candidate.email?.toLowerCase();
          return (
            candidateUsername === normalizedCreator ||
            candidateEmail === normalizedCreator
          );
        });
        if (isActive) {
          setCreatorInfo(found ?? null);
        }
      } catch (creatorError) {
        console.error("Error al cargar la información del creador", creatorError);
        if (isActive) {
          setCreatorInfo(null);
        }
      } finally {
        if (isActive) {
          setCreatorLoading(false);
        }
      }
    };

    void loadCreatorInfo();

    return () => {
      isActive = false;
    };
  }, [card?.creator]);

  const alreadyInSelected = useMemo(() => {
    if (!id || !selectedCollection) return false;
    const coll = myCollections.find((c) => c._id === selectedCollection);
    if (!coll || !Array.isArray(coll.cards)) return false;
    const ids = coll.cards.map((c: string | { _id: string }) =>
      typeof c === "string" ? c : (c as { _id: string })?._id
    );
    return ids.includes(id);
  }, [id, selectedCollection, myCollections]);
  const collectionsWithCard = useMemo(
    () =>
      myCollections.filter((collection) => {
        if (!id || !Array.isArray(collection.cards)) return false;
        return collection.cards.some((item) =>
          typeof item === "string" ? item === id : item?._id === id
        );
      }),
    [myCollections, id]
  );


  const handleAddToCollection = async () => {
    if (!user || !id || !selectedCollection) return;
    const targetCollection = myCollections.find(
      (collection) => collection._id === selectedCollection
    );
    const collectionTitle = targetCollection?.title ?? "la colección seleccionada";
    if (alreadyInSelected) {
      setActionMsg(`Esta carta ya está en ${collectionTitle}`);
      setActionErr("");
      return;
    }
    setAdding(true);
    setActionErr("");
    setActionMsg("");
    try {
      await apiFetch(`/collections/${selectedCollection}/addCard`, {
        method: "PUT",
        body: { cardId: id },
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMyCollections((prev) =>
        prev.map((collection) => {
          if (collection._id !== selectedCollection) return collection;
          const existingCards: Array<string | { _id: string }> = Array.isArray(
            collection.cards
          )
            ? collection.cards
            : [];
          if (
            existingCards.some(
              (item) => (typeof item === "string" ? item : item?._id) === id
            )
          ) {
            return collection;
          }
          return {
            ...collection,
            cards: [...existingCards, id],
          };
        })
      );
      setActionMsg(`Carta añadida a ${collectionTitle}`);
    } catch (e: unknown) {
      setActionErr(extractErrorMessage(e, "No se pudo añadir"));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFromCollection = async (collectionId: string) => {
    if (!user || !id) return;
    const targetCollection = myCollections.find(
      (collection) => collection._id === collectionId
    );
    const collectionTitle = targetCollection?.title ?? "la colección";
    let hasCard = false;
    if (targetCollection && Array.isArray(targetCollection.cards)) {
      hasCard = targetCollection.cards.some(
        (item) => (typeof item === "string" ? item : item?._id) === id
      );
    }
    if (!hasCard) {
      setActionErr(`Esta carta no está en ${collectionTitle}`);
      setActionMsg("");
      setPendingRemovalId(null);
      return;
    }
    setRemovingId(collectionId);
    setActionErr("");
    setActionMsg("");
    try {
      await apiFetch(`/collections/${collectionId}/removeCard`, {
        method: "PUT",
        body: { cardId: id },
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMyCollections((prev) =>
        prev.map((collection) => {
          if (collection._id !== collectionId) return collection;
          if (!Array.isArray(collection.cards)) {
            return { ...collection, cards: [] };
          }
          const updatedCards = collection.cards.filter(
            (item) => (typeof item === "string" ? item : item?._id) !== id
          );
          return {
            ...collection,
            cards: updatedCards,
          };
        })
      );
      setActionMsg(`Carta eliminada de ${collectionTitle}`);
    } catch (e: unknown) {
      setActionErr(extractErrorMessage(e, "No se pudo eliminar"));
    } finally {
      setRemovingId(null);
      setPendingRemovalId(null);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/cards");
    }
  };

  const creatorProfileId = creatorInfo?._id ?? creatorInfo?.id ?? null;
  const handleCreatorClick = () => {
    if (!creatorProfileId) return;
    navigate(`/users/${creatorProfileId}`);
  };
  const creatorDisplayName =
    creatorInfo?.username ?? creatorInfo?.email ?? card?.creator ?? "Anónimo";
  const creatorAvatar = creatorInfo?.image || DEFAULT_PROFILE_IMAGE;

  const formattedDate = useMemo(() => {
    if (!card?.date) return "-";
    const parsed = new Date(card.date);
    if (Number.isNaN(parsed.getTime())) return "-";

    return parsed.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [card?.date]);

  return (
    <PageLayout contentClassName="flex-1 overflow-y-auto p-6">
      <button
        onClick={handleGoBack}
        className="mb-6 rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
      >
        Volver
      </button>

      {loading && !card ? (
        <div className="text-white">Cargando carta...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : card ? (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex justify-center">
            <div className="card-3d-wrapper w-full max-w-xl">
              <div
                className="card-3d relative block h-full w-full overflow-hidden rounded-lg border border-black/30 shadow-2xl"
                onPointerMove={handleCardPointerMove}
                onPointerLeave={handleCardPointerLeave}
                onPointerCancel={handleCardPointerLeave}
                onFocus={handleCardFocus}
                onBlur={handleCardBlur}
                tabIndex={0}
              >
                {card.img ? (
                  <img
                    src={card.img}
                    alt={`Carta ${card.title}`}
                    className="card-3d-element h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="card-3d-element flex h-full min-h-[400px] w-full items-center justify-center border border-dashed border-gray-500 bg-gray-800 text-center text-white">
                    <div>Esta carta no tiene imagen asociada.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white/90 p-6 shadow-lg backdrop-blur">
            <h1 className="text-2xl font-bold text-gray-900">{card.title}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {card.type} - Coste {card.cost}
            </p>
            <div className="mt-3">
              <span className="text-sm font-semibold text-gray-900">Creador</span>
              {creatorLoading ? (
                <p className="mt-2 text-sm text-gray-600">
                  Cargando información del creador...
                </p>
              ) : creatorInfo ? (
                <button
                  type="button"
                  disabled={!creatorProfileId}
                  onClick={handleCreatorClick}
                  className={`mt-2 flex w-full max-w-xs items-center gap-3 rounded-lg border border-gray-200 bg-white/60 p-3 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/60 hover:border-gray-300 hover:bg-white ${!creatorProfileId ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  <img
                    src={creatorAvatar}
                    alt={`Perfil de ${creatorDisplayName}`}
                    className="h-12 w-12 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {creatorDisplayName}
                    </div>
                    <div className="text-xs text-gray-500">Ver perfil</div>
                  </div>
                </button>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  Creada por {card.creator}
                </p>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">Fecha: {formattedDate}</p>

            {faction && (
              <div className="mt-4 rounded border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-gray-400"
                    style={{ backgroundColor: faction.color }}
                  ></span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {faction.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {faction.territory}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  {faction.description}
                </p>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Descripcion
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                {card.description}
              </p>
            </div>

            {card.type === "Creature" && (
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-800">
                <div className="rounded bg-gray-100 p-3 text-center">
                  <div className="text-xs uppercase text-gray-500">Ataque</div>
                  <div className="text-xl font-semibold">{card.attack}</div>
                </div>
                <div className="rounded bg-gray-100 p-3 text-center">
                  <div className="text-xs uppercase text-gray-500">Defensa</div>
                  <div className="text-xl font-semibold">{card.defense}</div>
                </div>
              </div>
            )}

            {user && (
              <div className="mt-6 border-t pt-4">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Gestiona tus colecciones
                </h3>
                {myCollections.length === 0 ? (
                  <div className="text-sm text-gray-700">
                    No tienes colecciones aún. Crea una desde la pestaña
                    Colecciones.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3 text-black">
                      <select
                        className="p-2 rounded border text-sm"
                        value={selectedCollection}
                        onChange={(e) => setSelectedCollection(e.target.value)}
                      >
                        <option value="">Selecciona una colección</option>
                        {myCollections.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                      <button
                        className="rounded bg-green-600 px-4 py-2 text-white text-sm font-semibold disabled:opacity-60"
                        disabled={!selectedCollection || adding || Boolean(removingId)}
                        onClick={() => void handleAddToCollection()}
                      >
                        {adding ? "Añadiendo..." : "Añadir"}
                      </button>
                    </div>
                    {(actionMsg || actionErr) && (
                      <div className="flex flex-col gap-1 text-sm">
                        {actionMsg && (
                          <span className="text-green-600">{actionMsg}</span>
                        )}
                        {actionErr && (
                          <span className="text-red-600">{actionErr}</span>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Eliminar de tus colecciones
                      </h4>
                      {collectionsWithCard.length === 0 ? (
                        <p className="text-sm text-gray-700">
                          Esta carta no está en ninguna de tus colecciones.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {collectionsWithCard.map((collection) => {
                            const isPending = pendingRemovalId === collection._id;
                            const isRemoving = removingId === collection._id;
                            return (
                              <div
                                key={collection._id}
                                className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded border border-gray-200 bg-white text-center shadow-sm"
                              >
                                {isRemoving ? (
                                  <div className="text-xs font-semibold text-gray-600">
                                    Eliminando...
                                  </div>
                                ) : isPending ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-900">
                                      ¿Estás seguro?
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                        onClick={() => void handleRemoveFromCollection(collection._id)}
                                        disabled={isRemoving}
                                      >
                                        Sí
                                      </button>
                                      <button
                                        className="rounded bg-gray-300 px-3 py-1 text-xs font-semibold text-gray-800 disabled:opacity-60"
                                        onClick={() => setPendingRemovalId(null)}
                                        disabled={isRemoving}
                                      >
                                        No
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-medium text-gray-900">
                                      {collection.title}
                                    </span>
                                    <button
                                      className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300"
                                      onClick={() => {
                                        setPendingRemovalId(collection._id);
                                        setActionMsg("");
                                        setActionErr("");
                                      }}
                                      aria-label={`Eliminar carta de ${collection.title}`}
                                      disabled={Boolean(removingId)}
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-white">No se encontro la carta solicitada.</div>
      )}
    </PageLayout>
  );
};

export default CardDetail;
