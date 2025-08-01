import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HeroUIProvider } from "@heroui/react";
import { GOOGLE_CLIENT_ID } from "./utils/env.ts";

import "./index.css";
import App from "./App.tsx";
import { SessionProvider } from "./components/providers/SessionProvider.tsx";
import { ThemeProvider } from "./components/providers/ThemeProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SessionProvider>
        <HeroUIProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </HeroUIProvider>
      </SessionProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
