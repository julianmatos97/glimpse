import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  login as authLogin,
  logout as authLogout,
  getToken,
  verifyToken,
} from "./auth";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  token: string | null;
}

// Default context value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
  loading: true,
  error: null,
  token: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();

        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }

        const result = await verifyToken(token);

        if (result.valid) {
          setToken(token);
          setIsAuthenticated(true);
          setUser({ email: result.email });
        } else {
          // Token is invalid
          authLogout();
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        // Error verifying token
        authLogout();
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await authLogin({ email, password });
      setIsAuthenticated(true);
      setUser({ email });
      setToken(getToken());
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during login");
      }
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
    return false;
  };

  const logout = () => {
    authLogout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loading,
        error,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
