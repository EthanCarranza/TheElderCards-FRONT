import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from "./Components/Landing";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Cards from "./Components/Cards";
import CardDetail from "./Components/CardDetail";
import { AuthProvider } from "./contexts/AuthContext";
import Factions from "./Components/Factions";
import Profile from "./Components/Profile";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/cards/:id" element={<CardDetail />} />
          <Route path="/factions" element={<Factions />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
