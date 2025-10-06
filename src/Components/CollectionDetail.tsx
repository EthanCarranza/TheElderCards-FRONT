import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "./PageLayout";
import { apiFetch } from "./api";
import { extractErrorMessage } from "../utils/errors";
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
}

const CollectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collection, setCollection] = useState<CollectionDetailData | null>(
    null
  );

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
        const resp = await apiFetch<CollectionDetailData>(`/collections/${id}`);
        setCollection(resp.data);
      } catch (e: unknown) {
        setError(extractErrorMessage(e, "No se pudo cargar la colección"));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  return (
    <PageLayout contentClassName="flex-1 overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
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
            <div className="bg-white/90 text-black rounded-lg p-4 lg:p-6 shadow-lg">
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
              <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold break-words">
                {collection.title}
              </h1>
              {collection.description && (
                <p className="mt-2 text-sm sm:text-base lg:text-lg text-gray-800 whitespace-pre-line break-words">
                  {collection.description}
                </p>
              )}
            </div>

            <div className="w-full">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-4 lg:mb-6 text-white">
                Cartas ({collection.cards?.length || 0})
              </h2>
              {collection.cards?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
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
