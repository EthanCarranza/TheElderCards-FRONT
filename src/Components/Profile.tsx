import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser, FaCamera } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { DEFAULT_PROFILE_IMAGE } from "../constants/user";
import { apiFetch } from "./api";
import Message from "./Message";
import PageLayout from "./PageLayout";
import FormInput from "./FormInput";
import { extractErrorMessage } from "../utils/errors";

interface UserProfile {
  _id: string;
  id?: string;
  username: string;
  email: string;
  image?: string;
  role: string;
}

interface UpdateImageResponse {
  imageUrl: string;
  user: UserProfile;
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imagePreview, setImagePreview] = useState(DEFAULT_PROFILE_IMAGE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateUserRef = useRef(updateUser);
  const logoutRef = useRef(logout);

  useEffect(() => {
    updateUserRef.current = updateUser;
  }, [updateUser]);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      setLoading(false);
      return;
    }

    const currentUsername = user.username ?? "";
    const currentEmail = user.email ?? "";
    const currentImage = user.image ?? DEFAULT_PROFILE_IMAGE;

    const fetchProfile = async () => {
      try {
        const response = await apiFetch<UserProfile>(`/users/${user.userId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.status !== 200) {
          setErrorMessage("No fue posible cargar el perfil.");
          return;
        }

        const data = response.data;
        const resolvedImage = data.image ?? DEFAULT_PROFILE_IMAGE;
        setProfile(data);
        setUsername(data.username ?? "");
        setEmail(data.email ?? "");
        setImagePreview(resolvedImage);

        if (
          data.username !== currentUsername ||
          data.email !== currentEmail ||
          resolvedImage !== currentImage
        ) {
          const updater = updateUserRef.current;
          if (updater) {
            updater({
              username: data.username ?? "",
              email: data.email ?? currentEmail,
              image: resolvedImage,
            });
          }
        }
      } catch (error) {
        const message = extractErrorMessage(error, "No fue posible cargar el perfil.");
        setErrorMessage(message);
        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "status" in error.response &&
          (error.response as { status?: number }).status === 401
        ) {
          const logoutFn = logoutRef.current;
          if (logoutFn) {
            logoutFn();
          }
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [user?.userId, user?.token, navigate]);

  const currentImage = useMemo(() => imagePreview || DEFAULT_PROFILE_IMAGE, [imagePreview]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }
    setSelectedFile(file);
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const resetFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();

    if (!user || !profile) {
      setErrorMessage("Sesion no valida. Vuelve a iniciar sesion.");
      return;
    }

    const updates: Record<string, string> = {};
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedUsername && trimmedUsername !== profile.username) {
      updates.username = trimmedUsername;
    }

    if (trimmedEmail && trimmedEmail !== profile.email) {
      updates.email = trimmedEmail;
    }

    if (password) {
      if (password !== confirmPassword) {
        setErrorMessage("Las contrasenas no coinciden.");
        return;
      }
      if (!passwordRegex.test(password)) {
        setErrorMessage(
          "La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula, un numero y un simbolo especial."
        );
        return;
      }
      updates.password = password;
    }

    if (Object.keys(updates).length === 0 && !selectedFile) {
      setSuccessMessage("No hay cambios para guardar.");
      return;
    }

    setSaving(true);

    try {
      let updatedUser = profile;

      if (Object.keys(updates).length > 0) {
        const response = await apiFetch<UserProfile>(`/users/${user.userId}`, {
          method: "put",
          body: updates,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.status !== 200) {
          setErrorMessage("No fue posible actualizar los datos basicos.");
          return;
        }
        updatedUser = response.data;
        setProfile(updatedUser);
        setUsername(updatedUser.username ?? "");
        setEmail(updatedUser.email ?? "");
      }

      if (selectedFile) {
        const formData = new FormData();
        formData.append("img", selectedFile);
        const response = await apiFetch<UpdateImageResponse>(`/users/profileImage/${user.userId}`, {
          method: "put",
          body: formData,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.status !== 200) {
          setErrorMessage("No fue posible actualizar la imagen de perfil.");
          return;
        }

        const imageUrl = response.data.imageUrl ?? DEFAULT_PROFILE_IMAGE;
        setProfile(response.data.user);
        setImagePreview(imageUrl);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        updatedUser = response.data.user;
      }

      const resolvedImage = updatedUser.image ?? imagePreview ?? DEFAULT_PROFILE_IMAGE;
      updateUser({
        username: updatedUser.username ?? username,
        email: updatedUser.email ?? email,
        image: resolvedImage,
      });
      setPassword("");
      setConfirmPassword("");
      setSuccessMessage("Perfil actualizado correctamente.");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, "No fue posible guardar los cambios."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout contentClassName="flex items-center justify-center">
        <p className="text-lg">Cargando perfil...</p>
      </PageLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageLayout contentClassName="flex flex-1 justify-center py-10">
      <div className="w-full max-w-3xl rounded-lg bg-white p-8 text-black shadow-2xl">
        <h1 className="mb-6 text-3xl font-bold text-center">Perfil</h1>
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-black/80 shadow-lg">
            <img
              src={currentImage}
              alt="Perfil"
              className="h-full w-full object-cover"
            />
            <label className="absolute bottom-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition-colors hover:bg-gray-800">
              <FaCamera />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl font-semibold">{username || profile?.username}</p>
            <p className="text-sm text-gray-600">{email || profile?.email}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
              Rol: {profile?.role}
            </p>
          </div>
        </div>

        <Message message={errorMessage} type="error" />
        <Message message={successMessage} type="success" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Nombre de usuario"
            icon={<FaUser />}
            autoComplete="username"
          />
          <FormInput
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Correo electronico"
            icon={<FaEnvelope />}
            autoComplete="email"
          />
          <FormInput
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nueva contrasena"
            icon={<FaLock />}
            autoComplete="new-password"
          />
          <FormInput
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirmar contrasena"
            icon={<FaLock />}
            autoComplete="new-password"
          />
          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-600"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </PageLayout>
  );
};

export default Profile;
