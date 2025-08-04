import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { Session, User } from "../../utils/types";
import { useGoogleLogin } from "@react-oauth/google";
import { addToast } from "@heroui/react";
import { io } from "socket.io-client";

const SessionContext = createContext<Session>({
  isAuthenticated: false,
  currentUser: null,
  loading: true,
  refreshUser: () => {},
  login: () => {},
  logout: () => {},
  socket: null,
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [socket, _setSocket] = useState(io(window.location.origin, { autoConnect: false, withCredentials: true }));

  const refreshUser = () => {
    axios
      .get(`/api/me?seed=${Math.random()}`, { withCredentials: true })
      .then((res) => {
        setUser(res.data);
        addToast({ title: "Success", color: "success", description: "Google account was linked successfully." });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  const login = useGoogleLogin({
    flow: "auth-code",
    scope: "https://www.googleapis.com/auth/gmail.modify",
    onSuccess: async ({ code }) => {
      await axios.post("/api/google-login", { code }, { withCredentials: true });
      refreshUser();
    },
  });

  const logout = () => {
    axios.get("/api/logout", { withCredentials: true }).finally(() => {
      setUser(null);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!user) {
      socket.disconnect();
      return;
    }
    socket.connect();
  }, [user]);

  useEffect(() => {
    refreshUser();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated: !!user,
        currentUser: user,
        refreshUser,
        login,
        logout,
        loading,
        socket,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
