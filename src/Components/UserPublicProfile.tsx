import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageLayout from "./PageLayout";
import { apiFetch } from "./api";
import { DEFAULT_PROFILE_IMAGE } from "../constants/user";
import { extractErrorMessage } from "../utils/errors";
import CardTile, { type CardTileData } from "./CardTile";
import { useAuth } from "../contexts/AuthContext";

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

type RelationshipStatus = 'none' | 'friends' | 'sent' | 'received' | 'blocked';

const UserPublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [cards, setCards] = useState<CardTileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados para funcionalidad de amigos
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friendshipLoading, setFriendshipLoading] = useState(false);
  const [friendshipError, setFriendshipError] = useState("");

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

        // Verificar estado de amistad si el usuario actual está logueado y no es el mismo perfil
        if (currentUser && (userData._id || userData.id) && (userData._id !== currentUser.userId && userData.id !== currentUser.userId)) {
          const targetUserId = userData._id || userData.id;
          
          try {
            // Resetear estados
            setRelationshipStatus('none');
            setFriendshipId(null);
            setFriendshipError(''); // Limpiar errores anteriores
            
            console.log('🔍 Checking friendship status for targetUserId:', targetUserId);
            console.log('🔍 Current user ID:', currentUser.userId);
            
            // 1. Verificar si son amigos
            console.log('📞 Making request to /friendships...');
            const friendsResp = await apiFetch<{ friends?: Array<{ friendshipId: string; user?: { _id: string } }> }>('/friendships', {
              headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            
            console.log('📄 Friends response:', friendsResp.data);
            
            const friendship = friendsResp.data.friends?.find(f => {
              console.log('🔍 Checking friend:', f.user?._id, 'against target:', targetUserId);
              return f.user?._id === targetUserId;
            });
            
            if (friendship && isActive) {
              console.log('✅ Found friendship:', friendship);
              setRelationshipStatus('friends');
              setFriendshipId(friendship.friendshipId);
              return;
            } else {
              console.log('❌ No friendship found');
            }
            
            // 2. Verificar solicitudes recibidas
            console.log('📞 Making request to /friendships/pending...');
            const pendingResp = await apiFetch<{ requests?: Array<{ friendshipId: string; requester?: { _id: string } }> }>('/friendships/pending', {
              headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            
            console.log('📄 Pending requests response:', pendingResp.data);
            const receivedRequest = pendingResp.data.requests?.find(r => {
              console.log('🔍 Checking pending request from:', r.requester?._id, 'against target:', targetUserId);
              return r.requester?._id === targetUserId;
            });
            
            if (receivedRequest && isActive) {
              console.log('✅ Found received request:', receivedRequest);
              setRelationshipStatus('received');
              setFriendshipId(receivedRequest.friendshipId);
              return;
            } else {
              console.log('❌ No received request found');
            }
            
            // 3. Verificar solicitudes enviadas
            console.log('📞 Making request to /friendships/sent...');
            const sentResp = await apiFetch<{ requests?: Array<{ friendshipId: string; recipient?: { _id: string } }> }>('/friendships/sent', {
              headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            
            console.log('📄 Sent requests response:', sentResp.data);
            const sentRequest = sentResp.data.requests?.find(r => {
              console.log('🔍 Checking sent request to:', r.recipient?._id, 'against target:', targetUserId);
              return r.recipient?._id === targetUserId;
            });
            
            if (sentRequest && isActive) {
              console.log('✅ Found sent request:', sentRequest);
              setRelationshipStatus('sent');
              setFriendshipId(sentRequest.friendshipId);
              return;
            } else {
              console.log('❌ No sent request found');
            }
            
            // 4. Si no hay relación
            if (isActive) {
              console.log('🤷 No relationship found, setting to none');
              setRelationshipStatus('none');
            }
            
          } catch (friendshipError) {
            console.error("❌ Error al verificar estado de amistad:", friendshipError);
            if (isActive) {
              setRelationshipStatus('none');
              setFriendshipError(''); // No mostrar error por problemas de conexión
            }
          }
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
  }, [userId, currentUser]);

  // Función para enviar solicitud de amistad
  const handleSendFriendRequest = async () => {
    if (!currentUser || !profile) return;

    setFriendshipLoading(true);
    setFriendshipError("");

    try {
      const response = await apiFetch<{ friendship: { _id: string } }>("/friendships", {
        method: "POST",
        headers: { Authorization: `Bearer ${currentUser.token}` },
        body: { recipientId: profile._id || profile.id }
      });

      console.log('Friend request sent, response:', response.data);
      
      setRelationshipStatus('sent');
      // Establecer el friendshipId con la respuesta del backend
      if (response.data.friendship?._id) {
        setFriendshipId(response.data.friendship._id);
        console.log('Set friendshipId after sending request:', response.data.friendship._id);
      }
    } catch (err) {
      setFriendshipError(extractErrorMessage(err, "Error al enviar solicitud"));
    } finally {
      setFriendshipLoading(false);
    }
  };

  // Función para responder a solicitud de amistad
  const handleRespondToRequest = async (action: 'accept' | 'decline') => {
    if (!currentUser || !friendshipId) return;

    setFriendshipLoading(true);
    setFriendshipError("");

    try {
      await apiFetch(`/friendships/${friendshipId}/respond`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${currentUser.token}` },
        body: { action }
      });

      if (action === 'accept') {
        setRelationshipStatus('friends');
      } else {
        setRelationshipStatus('none');
        setFriendshipId(null);
      }
    } catch (err) {
      setFriendshipError(extractErrorMessage(err, "Error al responder solicitud"));
    } finally {
      setFriendshipLoading(false);
    }
  };

  // Función para eliminar amistad o cancelar solicitud
  const handleRemoveFriendship = async () => {
    console.log('handleRemoveFriendship called:', { currentUser: !!currentUser, friendshipId, relationshipStatus });
    
    if (!currentUser) {
      console.log('No currentUser');
      return;
    }
    
    if (!friendshipId) {
      console.log('No friendshipId');
      return;
    }

    setFriendshipLoading(true);
    setFriendshipError("");

    try {
      console.log('Making DELETE request to:', `/friendships/${friendshipId}`);
      
      await apiFetch(`/friendships/${friendshipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });

      console.log('DELETE request successful');
      setRelationshipStatus('none');
      setFriendshipId(null);
    } catch (err) {
      console.error('DELETE request failed:', err);
      setFriendshipError(extractErrorMessage(err, "Error al eliminar relación"));
    } finally {
      setFriendshipLoading(false);
    }
  };

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
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-semibold">{displayName}</h1>
              {profile.username && (
                <p className="mt-2 text-sm text-white/70">@{profile.username}</p>
              )}
              
              {/* Botones de amistad */}
              {currentUser && (profile._id !== currentUser.userId && profile.id !== currentUser.userId) && (
                <div className="mt-6 space-y-4">
                  {relationshipStatus === 'none' && (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={friendshipLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 text-white font-medium transition-colors"
                    >
                      {friendshipLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Enviando solicitud...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Enviar solicitud de amistad
                        </>
                      )}
                    </button>
                  )}
                  
                  {relationshipStatus === 'friends' && (
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-green-600/20 border border-green-500/40 px-3 py-2 text-green-300 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Ya son amigos
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => navigate(`/messages/${profile._id || profile.id}`)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Enviar mensaje
                        </button>
                        <button
                          onClick={handleRemoveFriendship}
                          disabled={friendshipLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 text-white font-medium transition-colors"
                        >
                          {friendshipLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Dejar de ser amigo
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {relationshipStatus === 'sent' && (
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-yellow-600/20 border border-yellow-500/40 px-3 py-2 text-yellow-300 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Solicitud de amistad enviada
                      </div>
                      <button
                        onClick={() => {
                          console.log('Cancel button clicked. friendshipId:', friendshipId);
                          handleRemoveFriendship();
                        }}
                        disabled={friendshipLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 text-white font-medium transition-colors"
                      >
                        {friendshipLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar solicitud
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {relationshipStatus === 'received' && (
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-2 text-blue-300 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        Te envió una solicitud de amistad
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => handleRespondToRequest('accept')}
                          disabled={friendshipLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 text-white font-medium transition-colors"
                        >
                          {friendshipLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Aceptar solicitud
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRespondToRequest('decline')}
                          disabled={friendshipLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 text-white font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rechazar solicitud
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {relationshipStatus === 'blocked' && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-red-700/20 border border-red-600/40 px-3 py-2 text-red-300 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                      Usuario bloqueado
                    </div>
                  )}
                </div>
              )}
              
              {/* Error de amistad */}
              {friendshipError && (
                <div className="mt-3 p-2 bg-red-600/20 border border-red-500 rounded text-red-200 text-sm">
                  {friendshipError}
                </div>
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
