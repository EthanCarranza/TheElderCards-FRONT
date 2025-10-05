import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import { extractErrorMessage } from "../utils/errors";
import { useAuth } from "../contexts/AuthContext";
import HeroSection from "./HeroSection";
import FloatingToast from "./FloatingToast";
import PageLayout from "./PageLayout";
import { DEFAULT_PROFILE_IMAGE } from "../constants/user";

function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const state = location.state as
      | {
          registrationSuccess?: boolean;
          credentials?: { email: string; password: string };
        }
      | undefined;

    if (!state?.registrationSuccess) return;

    setToastMessage("Registro exitoso. Iniciando sesión...");

    const credentials = state.credentials;
    const cleanupNavigation = () => {
      navigate(location.pathname, { replace: true, state: {} });
    };

    const autoLogin = async () => {
      if (!credentials) {
        setToastMessage(
          "Registro exitoso, pero introduce tus credenciales manualmente."
        );
        cleanupNavigation();
        return;
      }

      try {
        const response = await apiFetch("/users/login", {
          method: "post",
          body: credentials,
        });

        if (response.status !== 200) {
          setToastMessage(
            "Registro exitoso, pero no pudimos iniciar sesión automáticamente."
          );
          return;
        }

        const data = response.data as {
          token: string;
          user: {
            email: string;
            id: string;
            role: string;
            username?: string;
            image?: string;
          };
        };

        login({
          email: data.user.email,
          userId: data.user.id,
          token: data.token,
          role: data.user.role,
          username: data.user.username ?? "",
          image: data.user.image ?? DEFAULT_PROFILE_IMAGE,
        });

        setToastMessage("Registro exitoso. Sesión iniciada automáticamente.");
      } catch (error) {
        setToastMessage(
          extractErrorMessage(
            error,
            "Registro exitoso, pero falló el inicio de sesión automático."
          )
        );
      } finally {
        cleanupNavigation();
      }
    };

    void autoLogin();
  }, [location, login, navigate]);

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastMessage]);

  const handleCloseToast = () => {
    setToastMessage("");
  };

  return (
    <PageLayout
      overlay={
        <FloatingToast message={toastMessage} onClose={handleCloseToast} />
      }
      contentClassName="overflow-y-auto"
    >
      <HeroSection title="" image="logo.png" />
      <HeroSection title="¡Crea tus propias cartas!" image="hero.jpg" />
    </PageLayout>
  );
}

export default Landing;
