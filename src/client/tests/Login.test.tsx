import { describe, expect, it, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { SessionProvider } from "../components/providers/__mocks__/SessionProvider";
import Login from "../components/pages/Login";

vi.mock("../components/providers/SessionProvider");

describe("Login component", () => {
  it("renders with loading state", () => {
    const { getByText } = render(<Login />);
    expect(getByText("Sign in with")).toBeInTheDocument();
  });

  it("renders with non-loading state", () => {
    const { getByText } = render(<Login />);
    expect(getByText("Sign in with")).toBeInTheDocument();
  });

  it("button is disabled when loading is true", () => {
    const { getByText } = render(
      <SessionProvider testValue={{ ...deadSession, loading: true }}>
        <Login />
      </SessionProvider>
    );
    const button = getByText("Sign in with");
    expect(button).toBeDisabled();
  });

  it("button calls login function when pressed", async () => {
    const loginMock = deadSession.login;
    const { getByText } = render(
      <SessionProvider testValue={deadSession}>
        <Login />
      </SessionProvider>
    );
    const button = getByText("Sign in with");
    fireEvent.click(button);
    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
  });
});
