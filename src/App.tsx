import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from "./Components/Landing";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Cards from "./Components/Cards";
import { AuthProvider } from "./contexts/AuthContext";
import Factions from "./Components/Factions";

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
          <Route path="/cards" element={<Cards />} />
          <Route path="/factions" element={<Factions />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
