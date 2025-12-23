import { useColorScheme } from "./use-color-scheme";

export function useThemeColors() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    isDark,
    text: isDark ? "#fff" : "#000",
    textSecondary: isDark ? "#8e8e93" : "#3c3c43",
    background: isDark ? "#000" : "#fff",
    surface: isDark ? "#1c1c1e" : "#f2f2f7",
    border: isDark ? "#333" : "#e5e5ea",
    error: isDark ? "#FF453A" : "#FF3B30",
  };
}
