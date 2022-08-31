import React from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { Bell } from "@nandorojo/iconic";
import { SvgProps } from "react-native-svg";

interface Props {
  label: string;
  value: boolean;
  onToggle: () => void;
  Icon: React.ForwardRefExoticComponent<
    SvgProps & React.RefAttributes<SVGSVGElement>
  >;
}
export const Toggle: React.FC<Props> = ({ label, value, onToggle, Icon }) => {
  return (
    <View style={{ borderBottomColor: "#203A43", borderBottomWidth: 1 }}>
      <TouchableOpacity
        onPress={onToggle}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Icon
            width={24}
            height={24}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              color: "#fff",
              fontFamily: "Inter_200ExtraLight",
            }}
          >
            {label}
          </Text>
        </View>

        <Switch
          trackColor={{ false: "#203A43", true: "#203A43" }}
          thumbColor={value ? "#84c06c" : "#407383"}
          ios_backgroundColor="#3e3e3e"
          value={value}
          onValueChange={onToggle}
        />
      </TouchableOpacity>
    </View>
  );
};
