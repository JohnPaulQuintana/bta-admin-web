import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: { id: number; name: string };
  [key: string]: any;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log(parsedUser)
      // Check role
      if (![1, 2, 3].includes(parsedUser.role_id)) {
        toast.error("You don't have permission to access the admin dashboard");
        logout(); // auto logout
      } else {
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    }
    setLoading(false); // done checking localStorage
  }, []);

  async function login(email: string, password: string) {
    try {
      const res = await axios.post(`${API_URL}/auth/login-admin`, { email, password });
      const { token, user } = res.data;
      // console.log(user)
      // Check role
      if (![1, 2, 3].includes(user.role_id)) {
        // console.log("YES")
        toast.error("You don't have permission to access the admin dashboard");
        return false; // don't log them in
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setToken(token);
      setUser(user);
      setIsAuthenticated(true);

      return true;
    } catch (err) {
      return false;
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)!;
