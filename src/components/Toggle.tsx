import React from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
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
            flex: 1,
          }}
        >
          <Icon
            width={24}
            height={24}
            color="#fff"
            style={{ marginRight: 8, flex: 0, flexBasis: 24 }}
          />
          <Text
            style={{
              color: "#fff",
              fontFamily: "Inter_200ExtraLight",
              flex: 1,
            }}
          >
            {label}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onToggle}
          style={{
            height: 35,
            width: 45,
            position: "relative",
            flex: 0,
            flexBasis: 45,
          }}
        >
          <Switch
            style={{
              zIndex: -1,
              padding: 0,
              margin: 0,
              height: 35,
              width: 45,
              position: "absolute",
            }}
            trackColor={{ false: "#203A43", true: "#203A43" }}
            thumbColor={value ? "#84c06c" : "#407383"}
            ios_backgroundColor="#3e3e3e"
            value={value}
            disabled
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};
