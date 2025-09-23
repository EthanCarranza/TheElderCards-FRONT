import { useState } from "react";
import { apiFetch } from "./api";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FormInput from "./FormInput";
import Message from "./Message";
import SideBanner from "./SideBanner";

function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const { login } = useAuth();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === "email") setEmail(value);
    if (id === "password") setPassword(value);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!email || !password) {
      setErrorMessage("Todos los campos son obligatorios.");
    } else if (!emailRegex.test(email)) {
      setErrorMessage("El correo electrónico no es válido.");
    } else {
      try {
        const response = await apiFetch("/users/login", {
          method: "post",
          body: { email, password },
        });
        if (response.status === 401) {
          setErrorMessage(
            response.data?.message || "Credenciales incorrectas."
          );
          return;
        } else if (response.status !== 200) {
          setErrorMessage(
            "Hubo un error al intentar iniciar sesión. Por favor, inténtalo más tarde."
          );
          return;
        }
        const respuestaFinal = response.data;
        setSuccessMessage("¡Inicio de sesión exitoso!");
        login({
          email: respuestaFinal.user.email,
          userId: respuestaFinal.user.id,
          token: respuestaFinal.token,
          role: respuestaFinal.user.role,
        });
        setEmail("");
        setPassword("");
      } catch (error: any) {
        setErrorMessage(error?.response?.data?.message || "Error de conexión.");
      }
    }
  };
  return (
    <div className="relative min-h-screen bg-cover bg-center">
      <div className="flex">
        <SideBanner image="/bg.webp" position="left" />
        <div className="w-4/6 flex flex-col justify-between bg-black bg-opacity-90 min-h-screen">
          <Navbar />
          <div className="flex items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
              <h2 className="text-3xl font-bold mb-6 text-center text-black">
                Inicia sesión
              </h2>
              <Message message={errorMessage} type="error" />
              <Message message={successMessage} type="success" />
              <form onSubmit={handleSubmit}>
                <FormInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="Correo electrónico"
                  icon={<FaEnvelope />}
                  autoComplete="email"
                />
                <FormInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={handleChange}
                  placeholder="Contraseña"
                  icon={<FaLock />}
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors font-bold mt-4"
                >
                  Iniciar sesión
                </button>
              </form>
            </div>
          </div>
          <Footer />
        </div>
        <SideBanner image="/bg.webp" position="right" />
      </div>
    </div>
  );
}

export default Login;
