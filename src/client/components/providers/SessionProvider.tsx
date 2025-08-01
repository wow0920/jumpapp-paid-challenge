import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { User } from "../../utils/types";

interface Session {
  isAuthenticated: boolean;
  currentUser: User | null;
  loading: boolean;
}

const SessionContext = createContext<Session>({
  isAuthenticated: false,
  currentUser: null,
  loading: true,
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/me", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return <SessionContext.Provider value={{ isAuthenticated: !!user, currentUser: user, loading }}>{children}</SessionContext.Provider>;
};

export const useSession = () => useContext(SessionContext);
