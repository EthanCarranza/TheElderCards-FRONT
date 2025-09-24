import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SideBanner from "./SideBanner";
import { apiFetch } from "./api";

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

const CardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState =
    (location.state as { card?: Partial<CardDetailData>; faction?: Faction }) ||
    {};
  const stateCard = locationState.card;
  const stateFaction = locationState.faction;

  const [card, setCard] = useState<CardDetailData | null>(() => {
    if (!stateCard || !stateCard._id) return null;
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
    } as CardDetailData;
  });

  const [faction, setFaction] = useState<Faction | null>(() => {
    if (stateFaction) return stateFaction;
    if (
      stateCard &&
      typeof stateCard.faction === "object" &&
      stateCard.faction !== null
    ) {
      return stateCard.faction as Faction;
    }
    return null;
  });

  const [loading, setLoading] = useState(!stateCard);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Identificador de carta no valido");
        setLoading(false);
        return;
      }
      if (!stateCard) {
        setLoading(true);
      }
      setError("");
      try {
        const response = await apiFetch(`/cards/${id}`);
        const cardData: CardDetailData = response.data;
        setCard(cardData);

        if (cardData?.faction) {
          if (typeof cardData.faction === "object") {
            setFaction(cardData.faction as Faction);
          } else {
            try {
              const factionResponse = await apiFetch(
                `/factions/${cardData.faction}`
              );
              setFaction(factionResponse.data || null);
            } catch (fetchFactionError) {
              console.error("Error al cargar la faccion", fetchFactionError);
              setFaction(null);
            }
          }
        } else {
          setFaction(null);
        }
      } catch (err: any) {
        console.error("Error al cargar la carta", err);
        setError(err?.response?.data?.message || "Error al cargar la carta");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, stateCard]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/cards");
    }
  };

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
    <div className="relative min-h-screen bg-cover bg-center">
      <div className="flex">
        <SideBanner image="/bg.webp" position="left" />
        <div className="w-4/6 bg-black bg-opacity-90 min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-1 overflow-y-auto p-6">
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
                  {card.img ? (
                    <img
                      src={card.img}
                      alt={`Carta ${card.title}`}
                      className="w-full max-w-xl rounded-lg border border-gray-700 shadow-2xl"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full min-h-[400px] w-full max-w-xl items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800 text-center text-white">
                      <div>Esta carta no tiene imagen asociada.</div>
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-white/90 p-6 shadow-lg backdrop-blur">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {card.title}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {card.type} - Coste {card.cost}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Creada por {card.creator}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Fecha: {formattedDate}
                  </p>

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
                        <div className="text-xs uppercase text-gray-500">
                          Ataque
                        </div>
                        <div className="text-xl font-semibold">
                          {card.attack}
                        </div>
                      </div>
                      <div className="rounded bg-gray-100 p-3 text-center">
                        <div className="text-xs uppercase text-gray-500">
                          Defensa
                        </div>
                        <div className="text-xl font-semibold">
                          {card.defense}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-white">
                No se encontro la carta solicitada.
              </div>
            )}
          </div>
          <Footer />
        </div>
        <SideBanner image="/bg.webp" position="right" />
      </div>
    </div>
  );
};

export default CardDetail;
