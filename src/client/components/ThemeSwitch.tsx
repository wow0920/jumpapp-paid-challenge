import { Switch } from "@heroui/react";
import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "./providers/ThemeProvider";

export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <Switch
      isSelected={theme !== "dark"}
      onValueChange={(value) => setTheme(value ? "light" : "dark")}
      color="success"
      endContent={<FaMoon />}
      size="lg"
      startContent={<FaSun />}
    />
  );
}
