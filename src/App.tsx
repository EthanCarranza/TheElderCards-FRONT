import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from "./Components/Landing";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Cards from "./Components/Cards";
import CardDetail from "./Components/CardDetail";
import { AuthProvider } from "./contexts/AuthContext";
import Factions from "./Components/Factions";
import FactionDetail from "./Components/FactionDetail";
import Profile from "./Components/Profile";
import Collections from "./Components/Collections";
import CollectionDetail from "./Components/CollectionDetail";
import UserPublicProfile from "./Components/UserPublicProfile";
import Friends from "./Components/Friends";

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
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/factions" element={<Factions />} />
          <Route path="/factions/:id" element={<FactionDetail />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users/:userId" element={<UserPublicProfile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
