import { Platform, TextInput, View } from "react-native";
import React from "react";

export const setNativeProps = <T extends View | Element>(
  ref: React.RefObject<T>,
  attributes: Record<string, any>
): void => {
  if (ref.current) {
    if (Platform.OS !== "web") {
      (ref.current as View)?.setNativeProps?.(attributes);
      return;
    }
    Object.entries(attributes).forEach(([key, value]) => {
      (ref.current as Element)?.setAttribute?.(key, value);
    });
  }
};
