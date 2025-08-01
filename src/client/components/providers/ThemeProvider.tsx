import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type UITheme = "light" | "dark";

interface UIThemeObject {
  theme: UITheme;
  setTheme: (theme: UITheme) => void;
}

const ThemeContext = createContext<UIThemeObject>({
  theme: "dark",
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<UITheme>(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
