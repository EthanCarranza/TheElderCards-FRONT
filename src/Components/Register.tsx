import { useState } from "react";
import { apiFetch } from "./api";
import { extractErrorMessage } from "../utils/errors";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import FormInput from "./FormInput";
import Message from "./Message";
import SideBanner from "./SideBanner";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const usernameRegex = /^.{3,}$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === "username") setUsername(value);
    if (id === "email") setEmail(value);
    if (id === "password") setPassword(value);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    if (!username || !email || !password) {
      setErrorMessage("Todos los campos son obligatorios.");
    } else if (!usernameRegex.test(username)) {
      setErrorMessage("El nombre de usuario debe tener al menos 3 caracteres.");
    } else if (!passwordRegex.test(password)) {
      setErrorMessage(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial."
      );
    } else {
      try {
        const response = await apiFetch("/users/register", {
          method: "post",
          body: { username, email, password },
        });

        if (response.status === 409) {
          const message = (response.data as { message?: string })?.message;
          if (message === "Usuario ya existente") {
            setErrorMessage(
              "Ya existe un usuario con este nombre único. Por favor, introduce otro username."
            );
          } else {
            setErrorMessage(
              "Ya existe un usuario con este correo electrónico. Por favor, introduce otro correo."
            );
          }
          return;
        } else if (response.status !== 201) {
          setErrorMessage(
            "Hubo un error al intentar registrarse. Por favor, inténtalo más tarde."
          );
        }
        setSuccessMessage("¡Registro exitoso! Ahora puedes iniciar sesión.");
        setUsername("");
        setEmail("");
        setPassword("");
      } catch (error: unknown) {
        setErrorMessage(extractErrorMessage(error, "Error de conexión."));
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
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg text-2xl">
              <h2 className="text-4xl font-bold mb-6 text-center text-black">
                Crea tu cuenta
              </h2>
              <Message message={errorMessage} type="error" />
              <Message message={successMessage} type="success" />
              <form onSubmit={handleSubmit}>
                <FormInput
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleChange}
                  placeholder="Nombre de usuario"
                  icon={<FaUser />}
                  autoComplete="username"
                />
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
                  autoComplete="new-password"
                />
                <button
                  type="submit"
                  className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors font-bold mt-4"
                >
                  Registrarse
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

export default Register;
