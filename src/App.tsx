import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from "./Components/Landing";
import Register from "./Components/Register";
import Login from "./Components/Login";
import { AuthProvider } from "./contexts/AuthContext"; // Asegúrate de que la ruta es correcta

function App() {
  return (
    <AuthProvider>
      {" "}
      {/* Proveemos el contexto de autenticación a toda la aplicación */}
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
