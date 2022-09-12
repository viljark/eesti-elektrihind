import { Settings as SettingsIcon } from "@nandorojo/iconic";
import { MotiPressable } from "moti/interactions";
import React from "react";
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
      <SettingsIcon width={42} height={42} color="white" />
    </MotiPressable>
  );
};
