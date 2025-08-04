import { describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "../App";
import { SessionProvider } from "../components/providers/__mocks__/SessionProvider";

vi.mock("../components/providers/SessionProvider");

describe("App", () => {
  test("renders Dashboard when isAuthenticated is true", async () => {
    const { getByText } = render(
      <SessionProvider testValue={liveSession}>
        <App />
      </SessionProvider>
    );
    expect(getByText("Email Categories")).toBeInTheDocument();
  });

  test("renders Login when isAuthenticated is false", async () => {
    const { getByText } = render(
      <SessionProvider testValue={deadSession}>
        <App />
      </SessionProvider>
    );
    expect(getByText("Sign in with")).toBeInTheDocument();
  });

  test("renders footer with copyright information", async () => {
    const { getByText } = render(
      <SessionProvider testValue={deadSession}>
        <App />
      </SessionProvider>
    );
    expect(getByText("2025© Made with ❤️ by")).toBeInTheDocument();
    expect(getByText("Forrest Carlton")).toBeInTheDocument();
  });
});
