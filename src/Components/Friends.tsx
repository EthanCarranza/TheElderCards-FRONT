import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "./api";
import { extractErrorMessage } from "../utils/errors";
import PageLayout from "./PageLayout";
import { DEFAULT_PROFILE_IMAGE } from "../constants/user";

interface User {
  _id: string;
  username?: string;
  email?: string;
  image?: string;
}

interface Friend {
  friendshipId: string;
  user: User;
  friendsSince: string;
}

interface FriendRequest {
  friendshipId: string;
  requester?: User;
  recipient?: User;
  message?: string;
  createdAt: string;
}

interface SearchUser extends User {
  relationshipStatus: 'none' | 'friends' | 'sent' | 'received' | 'blocked';
}

type TabType = 'friends' | 'received' | 'sent' | 'search';

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados para amigos
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);

  // Estados para solicitudes recibidas
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [receivedCount, setReceivedCount] = useState(0);

  // Estados para solicitudes enviadas
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [sentCount, setSentCount] = useState(0);

  // Estados para búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Estados para acciones
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  // Cargar datos según la pestaña activa
  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError("");
    
    try {
      let endpoint = "";
      switch (activeTab) {
        case 'friends':
          endpoint = "/friendships";
          break;
        case 'received':
          endpoint = "/friendships/pending";
          break;
        case 'sent':
          endpoint = "/friendships/sent";
          break;
        case 'search':
          // No cargar nada automáticamente en búsqueda
          setLoading(false);
          return;
      }

      const response = await apiFetch<{ friends?: Friend[]; requests?: FriendRequest[]; count?: number }>(endpoint, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      switch (activeTab) {
        case 'friends':
          setFriends(response.data.friends || []);
          setFriendsCount(response.data.count || 0);
          break;
        case 'received':
          setReceivedRequests(response.data.requests || []);
          setReceivedCount(response.data.count || 0);
          break;
        case 'sent':
          setSentRequests(response.data.requests || []);
          setSentCount(response.data.count || 0);
          break;
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Error al cargar datos"));
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Buscar usuarios
  const handleSearch = async () => {
    if (!user || !searchQuery.trim() || searchQuery.trim().length < 2) {
      return;
    }

    setSearching(true);
    setError("");

    try {
      const response = await apiFetch<{ users: SearchUser[] }>(`/friendships/users/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setSearchResults(response.data.users || []);
    } catch (err) {
      setError(extractErrorMessage(err, "Error al buscar usuarios"));
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Enviar solicitud de amistad
  const sendFriendRequest = async (recipientId: string, message: string = "") => {
    if (!user || processing.has(recipientId)) return;

    setProcessing(prev => new Set(prev).add(recipientId));
    setError("");

    try {
      await apiFetch("/friendships", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: { recipientId, message }
      });

      // Actualizar el estado del usuario en resultados de búsqueda
      setSearchResults(prev => 
        prev.map(u => 
          u._id === recipientId 
            ? { ...u, relationshipStatus: 'sent' }
            : u
        )
      );
    } catch (err) {
      setError(extractErrorMessage(err, "Error al enviar solicitud"));
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipientId);
        return newSet;
      });
    }
  };

  // Responder solicitud de amistad
  const respondToRequest = async (friendshipId: string, action: 'accept' | 'decline') => {
    if (!user || processing.has(friendshipId)) return;

    setProcessing(prev => new Set(prev).add(friendshipId));
    setError("");

    try {
      await apiFetch(`/friendships/${friendshipId}/respond`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.token}` },
        body: { action }
      });

      // Recargar datos
      await loadData();

      // Si se aceptó, también recargar amigos si estamos en esa pestaña
      if (action === 'accept' && activeTab !== 'friends') {
        // Actualizar contador de amigos para mostrar en otras pestañas
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Error al responder solicitud"));
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendshipId);
        return newSet;
      });
    }
  };

  // Eliminar amistad o cancelar solicitud
  const removeFriendship = async (friendshipId: string) => {
    if (!user || processing.has(friendshipId)) return;

    setProcessing(prev => new Set(prev).add(friendshipId));
    setError("");

    try {
      await apiFetch(`/friendships/${friendshipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // Recargar datos
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err, "Error al eliminar relación"));
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendshipId);
        return newSet;
      });
    }
  };

  const getUserDisplayName = (user: User) => {
    return user.username || user.email || "Usuario";
  };

  const getUserAvatar = (user: User) => {
    return user.image || DEFAULT_PROFILE_IMAGE;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para navegar al perfil del usuario
  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (!user) {
    return (
      <PageLayout contentClassName="flex items-center justify-center min-h-screen">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Inicia sesión</h2>
          <p>Necesitas iniciar sesión para ver tus amigos</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout contentClassName="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold text-white text-center mb-8">
          Amigos
        </h1>

        {/* Pestañas */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Amigos ({friendsCount})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Recibidas ({receivedCount})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Enviadas ({sentCount})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Buscar usuarios
          </button>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Contenido según pestaña activa */}
        {activeTab === 'search' && (
          <div className="mb-8">
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim() || searchQuery.trim().length < 2}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {searching ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>
        )}

        {/* Lista de contenido */}
        <div className="bg-gray-800 rounded-lg p-6">
          {loading ? (
            <div className="text-center text-gray-300 py-8">
              <div>Cargando...</div>
            </div>
          ) : activeTab === 'friends' ? (
            friends.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <h3 className="text-lg font-medium mb-2">No tienes amigos aún</h3>
                <p>Busca usuarios y envíales solicitudes de amistad</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div key={friend.friendshipId} className="bg-gray-700 rounded-lg p-4">
                    <div 
                      className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-gray-600/50 rounded-lg p-2 transition-colors"
                      onClick={() => handleUserClick(friend.user._id)}
                      title="Ver perfil"
                    >
                      <img
                        src={getUserAvatar(friend.user)}
                        alt={getUserDisplayName(friend.user)}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {getUserDisplayName(friend.user)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Amigos desde {formatDate(friend.friendsSince)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Clic para ver perfil
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFriendship(friend.friendshipId)}
                      disabled={processing.has(friend.friendshipId)}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                    >
                      {processing.has(friend.friendshipId) ? "Eliminando..." : "Eliminar amistad"}
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'received' ? (
            receivedRequests.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <h3 className="text-lg font-medium mb-2">No tienes solicitudes pendientes</h3>
                <p>Cuando alguien te envíe una solicitud aparecerá aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedRequests.map((request) => (
                  <div key={request.friendshipId} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-600/50 rounded-lg p-2 transition-colors flex-1"
                        onClick={() => handleUserClick(request.requester!._id)}
                        title="Ver perfil"
                      >
                        <img
                          src={getUserAvatar(request.requester!)}
                          alt={getUserDisplayName(request.requester!)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {getUserDisplayName(request.requester!)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatDate(request.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Clic para ver perfil
                          </div>
                          {request.message && (
                            <div className="text-sm text-gray-300 mt-1">
                              "{request.message}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => respondToRequest(request.friendshipId, 'accept')}
                          disabled={processing.has(request.friendshipId)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => respondToRequest(request.friendshipId, 'decline')}
                          disabled={processing.has(request.friendshipId)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'sent' ? (
            sentRequests.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <h3 className="text-lg font-medium mb-2">No has enviado solicitudes</h3>
                <p>Busca usuarios y envíales solicitudes de amistad</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <div key={request.friendshipId} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-600/50 rounded-lg p-2 transition-colors flex-1"
                        onClick={() => handleUserClick(request.recipient!._id)}
                        title="Ver perfil"
                      >
                        <img
                          src={getUserAvatar(request.recipient!)}
                          alt={getUserDisplayName(request.recipient!)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {getUserDisplayName(request.recipient!)}
                          </div>
                          <div className="text-sm text-gray-400">
                            Enviada el {formatDate(request.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Clic para ver perfil
                          </div>
                          {request.message && (
                            <div className="text-sm text-gray-300 mt-1">
                              "{request.message}"
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFriendship(request.friendshipId)}
                        disabled={processing.has(request.friendshipId)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                      >
                        {processing.has(request.friendshipId) ? "Cancelando..." : "Cancelar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'search' ? (
            searchResults.length === 0 && searchQuery.trim() ? (
              <div className="text-center text-gray-400 py-8">
                <h3 className="text-lg font-medium mb-2">No se encontraron usuarios</h3>
                <p>Intenta con otro término de búsqueda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((searchUser) => (
                  <div key={searchUser._id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-600/50 rounded-lg p-2 transition-colors flex-1"
                        onClick={() => handleUserClick(searchUser._id)}
                        title="Ver perfil"
                      >
                        <img
                          src={getUserAvatar(searchUser)}
                          alt={getUserDisplayName(searchUser)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {getUserDisplayName(searchUser)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {searchUser.email}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Clic para ver perfil
                          </div>
                        </div>
                      </div>
                      <div>
                        {searchUser.relationshipStatus === 'none' && (
                          <button
                            onClick={() => sendFriendRequest(searchUser._id)}
                            disabled={processing.has(searchUser._id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                          >
                            {processing.has(searchUser._id) ? "Enviando..." : "Enviar solicitud"}
                          </button>
                        )}
                        {searchUser.relationshipStatus === 'friends' && (
                          <span className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded">
                            Ya son amigos
                          </span>
                        )}
                        {searchUser.relationshipStatus === 'sent' && (
                          <span className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded">
                            Solicitud enviada
                          </span>
                        )}
                        {searchUser.relationshipStatus === 'received' && (
                          <span className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded">
                            Te envió solicitud
                          </span>
                        )}
                        {searchUser.relationshipStatus === 'blocked' && (
                          <span className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded">
                            Bloqueado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
};

export default Friends;