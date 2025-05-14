import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  token: string | null;
  tipoUsuario: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      setTipoUsuario(payload.tipoUsuario);
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    const payload = JSON.parse(atob(newToken.split('.')[1]));
    setTipoUsuario(payload.tipoUsuario);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTipoUsuario(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, tipoUsuario, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
