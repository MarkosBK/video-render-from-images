import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getButtonStyle = (): ViewStyle => {
    if (disabled) {
      return {
        ...styles.button,
        backgroundColor: isDark ? "#333" : "#ccc",
      };
    }

    switch (variant) {
      case "primary":
        return {
          ...styles.button,
          backgroundColor: isDark ? "#0a7ea4" : "#007AFF",
        };
      case "secondary":
        return {
          ...styles.button,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: isDark ? "#0a7ea4" : "#007AFF",
        };
      case "danger":
        return {
          ...styles.button,
          backgroundColor: "#FF3B30",
        };
      default:
        return styles.button;
    }
  };

  const getTextStyle = (): TextStyle => {
    if (disabled) {
      return {
        ...styles.text,
        color: isDark ? "#666" : "#999",
      };
    }

    if (variant === "secondary") {
      return {
        ...styles.text,
        color: isDark ? "#0a7ea4" : "#007AFF",
      };
    }

    return styles.text;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
