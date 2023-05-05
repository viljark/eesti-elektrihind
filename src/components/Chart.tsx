import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryTheme,
  VictoryVoronoiContainer,
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { getColor, getGradientTopColor } from "../utils/colorUtils";
import { CustomBar } from "./CustomBar";
import React from "react";
import { tickFormatter } from "../utils/tickFormatter";

export function Chart(props: {
  width: number;
  landscape: boolean;
  height: number;
  onActivated: ([{ timestamp, price }]: [
    { timestamp: any; price: any }
  ]) => void;
  onTouchEnd: () => void;
  color: string;
  data: Array<{ timestamp: number; price: number }>;
  nowHourIndex: number;
  labels: ({ datum, index }: { datum: any; index: any }) => string;
}) {
  return (
    <VictoryChart
      width={props.width}
      height={
        props.landscape ? props.height - props.height / 10 : props.height / 2.5
      }
      padding={{
        left: 35,
        top: 35,
        bottom: 35,
        right: 10,
      }}
      scale={{ x: "time" }}
      domainPadding={{ x: 11, y: 0 }}
      theme={VictoryTheme.material}
      containerComponent={
        <VictoryVoronoiContainer
          voronoiDimension="x"
          activateLabels={false}
          onActivated={props.onActivated}
          onTouchEnd={props.onTouchEnd}
        />
      }
    >
      <Defs>
        {/* @ts-ignore */}
        <LinearGradient
          id="linear"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
          // gradientTransform="rotate(10)"
        >
          <Stop offset="0%" stopColor="#2c5364" />
          <Stop offset="50%" stopColor="#203A43" />
          <Stop offset="100%" stopColor="#0F2027" />
        </LinearGradient>
        {/* @ts-ignore */}
        <LinearGradient id="selectedHour" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={getGradientTopColor(props.color)} />
          <Stop offset="100%" stopColor="#0F2027" />
        </LinearGradient>
        {/* @ts-ignore */}
        <LinearGradient id="currentHour" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop
            offset="0%"
            stopColor={getGradientTopColor(
              getColor(props.data[props.nowHourIndex].price)
            )}
          />
          <Stop offset="100%" stopColor="#0F2027" />
        </LinearGradient>
      </Defs>
      <VictoryBar
        data={props.data}
        x="timestamp"
        y="price"
        barWidth={props.width / 24 - 4.5}
        cornerRadius={{ top: (props.width / 24 - 4.5) / 2 }}
        dataComponent={<CustomBar />}
        style={{
          data: {
            fill: "url(#linear)",
          },
        }}
        labels={props.labels}
        labelComponent={
          <VictoryLabel
            style={{
              fill: "white",
              fontSize: props.landscape ? 12 : 8,
            }}
            dy={-5}
          />
        }
      />
      <VictoryAxis
        dependentAxis
        style={{
          grid: { stroke: "none" },
          axis: {
            stroke: "none",
          },
          ticks: {
            stroke: "none",
          },
          tickLabels: {
            fill: "white",
            fontSize: props.landscape ? 12 : 10,
          },
        }}
      />
      <VictoryAxis
        tickCount={props.data.length}
        tickFormat={tickFormatter}
        style={{
          grid: { stroke: "none" },
          axis: {
            stroke: "#0F2027",
            strokeWidth: 1,
            strokeOpacity: 1,
          },
          ticks: {
            stroke: "none",
          },
          tickLabels: {
            fill: "white",
            fontSize: props.landscape ? 12 : 10,
          },
        }}
      />
    </VictoryChart>
  );
}
