import { BarProps } from "victory-bar";
import { formatHours } from "../../formatters";
import { Bar } from "victory-native";
import React from "react";

export const CustomBar = (props: BarProps) => {
  const hours = formatHours(new Date(props.datum.timestamp));

  const active = hours === `${formatHours(new Date())}`;
  return (
    <Bar
      {...props}
      style={{
        borderColor: "red",
        ...props.style,

        fill: props.active
          ? "url(#selectedHour)"
          : active
          ? "url(#currentHour)"
          : props.style.fill,
      }}
    />
  );
};
