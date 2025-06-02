import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User } from '../Types/User';
import { adaptarUsuario } from '../Types/UserAdapter';

interface AuthContextType {
  user: User | null;
  token: string | null;
  tipoUsuario: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const decoded: any = jwtDecode(savedToken);
        const adaptedUser = adaptarUsuario(decoded);
        setUser(adaptedUser);
        setTipoUsuario(decoded.tipoUsuario || null);
        setToken(savedToken);
      } catch (err) {
        console.error('Token inválido o expirado');
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode(newToken);
      const adaptedUser = adaptarUsuario(decoded);
      localStorage.setItem('token', newToken);
      setUser(adaptedUser);
      setTipoUsuario(adaptedUser.rol || null);
      setToken(newToken);
    } catch {
      console.error('Token inválido al hacer login');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTipoUsuario(null);
    setToken(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, tipoUsuario, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
