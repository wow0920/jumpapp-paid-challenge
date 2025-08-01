import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { User } from "../../utils/types";

interface Session {
  isAuthenticated: boolean;
  currentUser: User | null;
  loading: boolean;
  refreshUser: () => void;
  logout: () => void;
}

const SessionContext = createContext<Session>({
  isAuthenticated: false,
  currentUser: null,
  loading: true,
  refreshUser: () => {},
  logout: () => {},
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => {
    axios
      .get("/api/me", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  const logout = () => {
    axios.get("/api/logout", { withCredentials: true }).finally(() => {
      setUser(null);
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated: !!user,
        currentUser: user,
        refreshUser,
        logout,
        loading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
