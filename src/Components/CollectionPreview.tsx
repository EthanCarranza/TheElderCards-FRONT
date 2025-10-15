import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export interface CollectionPreviewData {
  _id: string;
  title: string;
  description?: string;
  img?: string;
  creator: string | { _id: string; username?: string; email?: string };
  isPrivate?: boolean;
  cards?: Array<{ _id: string; title: string; img?: string }>;
}

interface Props {
  collection: CollectionPreviewData;
  onDelete?: (id: string) => void;
  onEdit?: (collection: CollectionPreviewData) => void;
}

const CollectionPreview: React.FC<Props> = ({
  collection,
  onDelete,
  onEdit,
}) => {
  const { user } = useAuth();
  const creatorId =
    typeof collection.creator === "string"
      ? collection.creator
      : collection.creator?._id;
  const isOwner = user?.userId && creatorId === user.userId;
  const isAdmin = user?.role === "admin";
  const canDeleteCollection = () => {
    if (!collection || !user) return false;
    if (collection.isPrivate) {
      return isOwner;
    }
    return isOwner || isAdmin;
  };

  return (
    <div className="group block rounded bg-white/90 text-black shadow p-3 relative hover:shadow-lg transition">
      <div className="relative">
        {collection.img ? (
          <img
            src={collection.img}
            alt={collection.title}
            className="w-full h-32 sm:h-36 lg:h-40 xl:h-48 object-cover rounded"
          />
        ) : (
          <div className="w-full h-32 sm:h-36 lg:h-40 xl:h-48 bg-gray-200 rounded flex items-center justify-center text-gray-600 text-sm">
            Sin imagen
          </div>
        )}
        {user && canDeleteCollection() && (
          <div className="absolute top-2 right-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              {isOwner && onEdit && (
                <button
                  onClick={() => onEdit(collection)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg transition-colors"
                  title="Editar colección"
                >
                  ✏️
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(collection._id)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg transition-colors"
                  title="Eliminar colección"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="font-semibold group-hover:underline text-sm sm:text-base lg:text-lg break-words">
          {collection.title}
        </div>
        {collection.description && (
          <div className="text-xs sm:text-sm lg:text-base text-gray-700 line-clamp-2 break-words">
            {collection.description}
          </div>
        )}
        <div className="mt-2 text-xs sm:text-sm text-gray-600 space-y-1">
          <div>{collection.cards?.length || 0} cartas</div>
          {!collection.isPrivate && (
            <div className="text-gray-500">
              Por:{" "}
              {typeof collection.creator === "object"
                ? collection.creator.username || collection.creator.email
                : "Creador desconocido"}
            </div>
          )}
          {collection.isPrivate && (
            <div className="flex items-center gap-1 text-amber-600">
              <span>🔒</span>
              <span>Privada</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionPreview;
