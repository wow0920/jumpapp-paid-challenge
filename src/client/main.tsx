import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { GOOGLE_CLIENT_ID } from "./utils/env.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import App from "./App.tsx";
import { SessionProvider } from "./components/providers/SessionProvider.tsx";
import { ThemeProvider } from "./components/providers/ThemeProvider.tsx";
import { ModalProvider } from "./components/providers/ModalProvider.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <SessionProvider>
          <HeroUIProvider>
            <ToastProvider />
            <ThemeProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </ThemeProvider>
          </HeroUIProvider>
        </SessionProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
