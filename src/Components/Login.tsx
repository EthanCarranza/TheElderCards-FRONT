import { type ChangeEvent, type FormEvent, useState } from "react";
import { apiFetch } from "./api";
import { extractErrorMessage } from "../utils/errors";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FormInput from "./FormInput";
import Message from "./Message";
import PageLayout from "./PageLayout";

interface LoginUser {
  email: string;
  id: string;
  role: string;
}

interface LoginSuccessResponse {
  token: string;
  user: LoginUser;
}

interface LoginErrorResponse {
  message?: string;
}

type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

const isLoginSuccess = (data: LoginResponse): data is LoginSuccessResponse => {
  return (
    typeof data === "object" &&
    data !== null &&
    "token" in data &&
    "user" in data &&
    typeof (data as LoginSuccessResponse).user?.email === "string"
  );
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { login } = useAuth();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    if (id === "email") setEmail(value);
    if (id === "password") setPassword(value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Todos los campos son obligatorios.");
      return;
    }
    if (!emailRegex.test(email)) {
      setErrorMessage("El correo electronico no es valido.");
      return;
    }

    try {
      const response = await apiFetch<LoginResponse>("/users/login", {
        method: "post",
        body: { email, password },
      });

      if (response.status === 401) {
        const data = response.data as LoginErrorResponse;
        setErrorMessage(data.message ?? "Credenciales incorrectas.");
        return;
      }

      if (response.status !== 200) {
        setErrorMessage(
          "Hubo un error al intentar iniciar sesion. Por favor, intentalo mas tarde."
        );
        return;
      }

      const data = response.data;
      if (!isLoginSuccess(data)) {
        setErrorMessage("Respuesta inesperada del servidor.");
        return;
      }

      setSuccessMessage("Inicio de sesion exitoso!");
      login({
        email: data.user.email,
        userId: data.user.id,
        token: data.token,
        role: data.user.role,
      });
      setEmail("");
      setPassword("");
    } catch (error: unknown) {
      setErrorMessage(extractErrorMessage(error, "Error de conexion."));
    }
  };

  return (
    <PageLayout>
      <Navbar />
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
          <h2 className="mb-6 text-center text-3xl font-bold text-black">
            Inicia sesion
          </h2>
          <Message message={errorMessage} type="error" />
          <Message message={successMessage} type="success" />
          <form onSubmit={handleSubmit}>
            <FormInput
              id="email"
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="Correo electronico"
              icon={<FaEnvelope />}
              autoComplete="email"
            />
            <FormInput
              id="password"
              type="password"
              value={password}
              onChange={handleChange}
              placeholder="Contrasena"
              icon={<FaLock />}
              autoComplete="current-password"
            />
            <button
              type="submit"
              className="mt-4 w-full rounded bg-black px-4 py-2 font-bold text-white transition-colors hover:bg-gray-800"
            >
              Iniciar sesion
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </PageLayout>
  );
}

export default Login;

