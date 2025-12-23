import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PickerOption {
  label: string;
  value: string;
}

interface PickerProps {
  label: string;
  value: string;
  options: PickerOption[];
  onValueChange: (value: string) => void;
}

export function Picker({ label, value, options, onValueChange }: PickerProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <>
      <View style={styles.container}>
        <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
          {label}
        </Text>
        <TouchableOpacity
          style={[
            styles.selector,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7",
              borderColor: isDark ? "#333" : "#e5e5ea",
            },
          ]}
          onPress={() => setIsVisible(true)}
        >
          <Text
            style={[styles.selectorText, { color: isDark ? "#fff" : "#000" }]}
          >
            {selectedOption?.label || "Выбрать"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={isDark ? "#8e8e93" : "#3c3c43"}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: isDark ? "#fff" : "#000" }]}
              >
                {label}
              </Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#8e8e93" : "#3c3c43"}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.selectedOption,
                    {
                      borderBottomColor: isDark ? "#2c2c2e" : "#e5e5ea",
                    },
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setIsVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          item.value === value
                            ? isDark
                              ? "#0a7ea4"
                              : "#007AFF"
                            : isDark
                              ? "#fff"
                              : "#000",
                      },
                      item.value === value && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={isDark ? "#0a7ea4" : "#007AFF"}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5ea",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  selectedOption: {},
  optionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    fontWeight: "600",
  },
});
