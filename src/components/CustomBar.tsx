import { BarProps } from "victory-bar";
import { formatHours } from "../../formatters";
import { Bar } from "victory-native";
import React from "react";

export const CustomBar = (props: BarProps) => {
  const hours = props.datum.hours;

  const active = hours === `${formatHours(new Date())}`;
  return (
    <Bar
      {...props}
      style={{
        borderColor: "red",
        ...props.style,

        fill: props.active
          ? "url(#linearBorder)"
          : active
          ? "url(#current)"
          : props.style.fill,
      }}
    />
  );
};
