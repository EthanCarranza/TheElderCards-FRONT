import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: {
    email: string;
    userId: string;
    token: string;
    role: string;
  } | null;
  login: (data: {
    email: string;
    userId: string;
    token: string;
    role: string;
  }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<{
    email: string;
    userId: string;
    token: string;
    role: string;
  } | null>(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    if (token && userId && email && role) {
      return { email, userId, token, role };
    }
    return null;
  });

  const login = (data: {
    email: string;
    userId: string;
    token: string;
    role: string;
  }) => {
    setUser(data);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", data.userId);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
