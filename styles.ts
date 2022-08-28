import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  blockShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  textShadow: {
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});

export const blockBackground = "rgba(0, 0, 0, 0.5)";
