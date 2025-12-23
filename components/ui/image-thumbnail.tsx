import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";

interface ImageThumbnailProps {
  uri: string;
  onRemove: () => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const THUMBNAIL_SIZE = (SCREEN_WIDTH - 64) / 3; // 3 columns with padding

export function ImageThumbnail({ uri, onRemove }: ImageThumbnailProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} contentFit="cover" />
      <TouchableOpacity
        style={[
          styles.removeButton,
          {
            backgroundColor: isDark
              ? "rgba(0,0,0,0.8)"
              : "rgba(255,255,255,0.9)",
          },
        ]}
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    margin: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    borderRadius: 12,
    padding: 2,
  },
});
