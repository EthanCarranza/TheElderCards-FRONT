import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CreateCard from "./CreateCard";
import { CARD_TYPES } from "../constants/cardTypes";
import { apiFetch } from "./api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SideBanner from "./SideBanner";

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

interface Card {
  _id: string;
  title: string;
  type: string;
  faction: string | Faction;
  creator: string;
  cost: number;
  img?: string;
  attack?: number;
  defense?: number;
}

interface Filters {
  type?: string;
  faction?: string;
  title?: string;
  creator?: string;
  cost?: string;
  attack?: string;
  defense?: string;
  sort?: string;
}

const Cards = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [factions, setFactions] = useState<Faction[]>([]);

  const fetchCards = async () => {
    setLoading(true);
    setError("");
    let query = `?page=${page}&limit=20`;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query += `&${key}=${encodeURIComponent(value)}`;
    });
    try {
      const response = await apiFetch(`/cards${query}`);
      setCards(response.data.cards || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setError(
          (err.response as { data: { message?: string } }).data.message ||
            "Error al cargar cartas"
        );
      } else {
        setError("Error al cargar cartas");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFactions = async () => {
    try {
      const response = await apiFetch("/factions");
      setFactions(response.data || []);
    } catch {
      setFactions([]);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [page, filters]);

  useEffect(() => {
    fetchFactions();
  }, []);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === "type" && typeof value === "string" && value
        ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
        : value;
    setFilters((prev) => ({ ...prev, [name]: nextValue }));
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, sort: e.target.value }));
    setPage(1);
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center">
      <div className="flex">
        <SideBanner image="/bg.webp" position="left" />
        <div className="w-4/6 bg-black bg-opacity-90 min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Cartas</h2>
            {showCreate && user ? (
              <>
                <button
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mb-4"
                  onClick={() => setShowCreate(false)}
                >
                  ← Volver al listado
                </button>
                <CreateCard
                  onCreated={() => {
                    setShowCreate(false);
                    fetchCards();
                  }}
                  factions={factions.map((f) => ({
                    _id: f._id,
                    title: f.title,
                  }))}
                />
              </>
            ) : (
              <div className="mb-4 flex flex-wrap gap-4">
                <select
                  name="type"
                  value={filters.type ? filters.type.toLowerCase() : ""}
                  onChange={handleFilterChange}
                  className="p-2 rounded"
                >
                  <option value="">Tipo</option>
                  {CARD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <select
                  name="faction"
                  value={filters.faction || ""}
                  onChange={handleFilterChange}
                  className="p-2 rounded"
                  disabled={factions.length === 0}
                >
                  <option value="">
                    {factions.length === 0 ? "Sin facciones" : "Facción"}
                  </option>
                  {factions.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.title}
                    </option>
                  ))}
                </select>
                <input
                  name="title"
                  value={filters.title || ""}
                  onChange={handleFilterChange}
                  placeholder="Título"
                  className="p-2 rounded"
                />
                <input
                  name="creator"
                  value={filters.creator || ""}
                  onChange={handleFilterChange}
                  placeholder="Creador (username)"
                  className="p-2 rounded"
                />
                <input
                  name="cost"
                  type="number"
                  min={0}
                  max={10}
                  value={filters.cost || ""}
                  onChange={handleFilterChange}
                  placeholder="Coste"
                  className="p-2 rounded"
                />
                {filters.type === "Creature" && (
                  <>
                    <input
                      name="attack"
                      type="number"
                      min={0}
                      max={10}
                      value={filters.attack || ""}
                      onChange={handleFilterChange}
                      placeholder="Ataque"
                      className="p-2 rounded"
                    />
                    <input
                      name="defense"
                      type="number"
                      min={1}
                      max={10}
                      value={filters.defense || ""}
                      onChange={handleFilterChange}
                      placeholder="Defensa"
                      className="p-2 rounded"
                    />
                  </>
                )}
                <select
                  name="sort"
                  value={filters.sort || ""}
                  onChange={handleSortChange}
                  className="p-2 rounded"
                >
                  <option value="">Ordenar por…</option>
                  <option value="title_asc">Título A-Z</option>
                  <option value="title_desc">Título Z-A</option>
                  <option value="creator_asc">Creador A-Z</option>
                  <option value="creator_desc">Creador Z-A</option>
                  <option value="faction_asc">Facción A-Z</option>
                  <option value="faction_desc">Facción Z-A</option>
                  <option value="type_asc">Tipo A-Z</option>
                  <option value="type_desc">Tipo Z-A</option>
                  <option value="cost_asc">Coste ↑</option>
                  <option value="cost_desc">Coste ↓</option>
                  <option value="attack_asc">Ataque ↑</option>
                  <option value="attack_desc">Ataque ↓</option>
                  <option value="defense_asc">Defensa ↑</option>
                  <option value="defense_desc">Defensa ↓</option>
                </select>
                {user && (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-2"
                    onClick={() => setShowCreate(true)}
                  >
                    Crear carta
                  </button>
                )}
              </div>
            )}
            {!showCreate &&
              (loading ? (
                <div className="text-white">Cargando...</div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <>
                  {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center w-full py-12">
                      {/* añadir ilustración o icono aquí */}
                      <span className="text-lg text-gray-300 font-semibold">
                        No se han encontrado cartas
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {cards.map((card) => {
                        let factionObj: Faction | undefined = undefined;
                        if (
                          typeof card.faction === "object" &&
                          card.faction !== null
                        ) {
                          factionObj = card.faction as Faction;
                        } else if (typeof card.faction === "string") {
                          factionObj = factions.find(
                            (f) => f._id === card.faction
                          );
                        }
                        return (
                          <div className="card-3d-wrapper">
                            <Link
                              key={card._id}
                              to={`/cards/${card._id}`}
                              state={{ card, faction: factionObj }}
                              className="card-3d group relative block h-full w-full overflow-hidden rounded-lg border border-black/30 shadow-lg"
                              onPointerMove={handleCardPointerMove}
                              onPointerLeave={handleCardPointerLeave}
                              onPointerCancel={handleCardPointerLeave}
                              onFocus={handleCardFocus}
                              onBlur={handleCardBlur}
                            >
                              {card.img ? (
                                <img
                                  src={card.img}
                                  alt={`Carta ${card.title}`}
                                  className="card-3d-element h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="card-3d-element flex h-full min-h-[320px] w-full flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 p-6 text-center text-white">
                                  <div className="text-lg font-semibold">
                                    {card.title}
                                  </div>
                                  <div className="mt-2 text-sm opacity-80">
                                    {card.type} - Coste {card.cost}
                                  </div>
                                  <div className="mt-4 text-xs text-gray-200">
                                    Pulsa para ver detalles
                                  </div>
                                </div>
                              )}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex justify-center items-center gap-2 mt-6">
                    {page > 1 && (
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
                      >
                        Anterior
                      </button>
                    )}
                    <span className="text-white">
                      Página {page} de {totalPages}
                    </span>
                    {page < totalPages && totalPages > 1 && (
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
                      >
                        Siguiente
                      </button>
                    )}
                  </div>
                </>
              ))}
          </div>
          <Footer />
        </div>
        <SideBanner image="/bg.webp" position="right" />
      </div>
    </div>
  );
};

export default Cards;
