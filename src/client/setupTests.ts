import "@testing-library/jest-dom";
import { Session, User } from "./utils/types";
import { vi } from "vitest";

export const currentUser = { id: "customId", email: "frcarlton95@gmail.com", accounts: [] };

declare global {
  var currentUser: User;
  var deadSession: Session;
  var liveSession: Session;
}

globalThis.currentUser = { id: "customId", email: "frcarlton95@gmail.com", accounts: [] };

globalThis.deadSession = {
  isAuthenticated: false,
  currentUser: null,
  loading: false,
  refreshUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  socket: null,
};

globalThis.liveSession = {
  isAuthenticated: true,
  currentUser,
  loading: false,
  refreshUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};
