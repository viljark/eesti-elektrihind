import { MotiPressable } from "moti/interactions";
import React from "react";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

interface Props {
  onPress: () => void;
}
export const SettingsButton: React.FC<Props> = (props) => {
  return (
    <MotiPressable
      transition={{ type: "timing", duration: 100 }}
      onPress={props.onPress}
      style={{
        padding: 10,
      }}
      animate={({ pressed }) => {
        "worklet";
        return {
          scale: pressed ? 0.8 : 1,
        };
      }}
    >
      <Icon size={42} color="white" name="cog" />
    </MotiPressable>
  );
};
