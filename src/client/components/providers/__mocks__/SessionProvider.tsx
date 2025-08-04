import { createContext, useContext, ReactNode } from "react";

import { User } from "../../../utils/types";

interface Session {
  isAuthenticated: boolean;
  currentUser: User | null;
  loading: boolean;
  refreshUser: () => void;
  login: () => void;
  logout: () => void;
  socket: any;
}

const SessionContext = createContext<Session>({
  isAuthenticated: false,
  currentUser: null,
  loading: true,
  refreshUser: () => {},
  login: () => {},
  logout: () => {},
  socket: null,
});

type Props = {
  children: ReactNode;
  testValue: Session; // Notice the mock provider accepts the value that it will pass down, as a prop
};

export const SessionProvider = (props: Props) => {
  return <SessionContext.Provider value={props.testValue}>{props.children}</SessionContext.Provider>;
};

export const useSession = () => useContext(SessionContext);
