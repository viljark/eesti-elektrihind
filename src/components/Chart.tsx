import { View } from "react-native";
import {
  CartesianChart,
  Bar,
  useChartPressState,
  useChartTransformState,
  CartesianActionsHandle,
} from "victory-native";
import { LinearGradient, useFont, vec, Text } from "@shopify/react-native-skia";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getColor, getGradientTopColor } from "../utils/colorUtils";
import { tickFormatter } from "../utils/tickFormatter";
import * as Haptics from "expo-haptics";
import { AndroidHaptics } from "expo-haptics";

// @ts-ignore
import InterMedium from "../../assets/fonts/Inter_18pt-Light.ttf";
import { useAnimatedReaction } from "react-native-reanimated";
import { round } from "lodash";
import { ScrollView } from "react-native-gesture-handler";
import { settingsState } from "./Settings";
import { useSnapshot } from "valtio/react";
import { scheduleOnRN } from "react-native-worklets";

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
  const fontSize = props.landscape ? 12 : 10;
  const font = useFont(InterMedium, fontSize);
  const scrollViewRef = useRef<ScrollView>(null);
  const [matchedIndex, setMatchedIndex] = useState(-1);

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { price: 0 },
    matchedIndex: 0,
  });

  const { state: transformState } = useChartTransformState({
    scaleX: 1.0,
    scaleY: 1.0,
  });
  const ref = useRef<CartesianActionsHandle<typeof state>>(null);

  const { is15min } = useSnapshot(settingsState);

  const barWidth = useMemo(() => {
    return 13;
  }, [props.width, props.data]);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  }, [is15min]);
  useAnimatedReaction(
    () => state.matchedIndex.value,
    (val, oldVal) => {
      if (val !== oldVal) {
        scheduleOnRN(setMatchedIndex, val);
      }
    }
  );

  useEffect(() => {
    if (isActive) {
      const closestDatum = props.data[matchedIndex];

      if (closestDatum) {
        props.onActivated([
          { timestamp: closestDatum.timestamp, price: closestDatum.price },
        ]);
      }
    } else {
      props.onTouchEnd();
    }
  }, [isActive, props.onActivated, props.onTouchEnd, props.data, matchedIndex]);

  useEffect(() => {
    Haptics.performAndroidHapticsAsync(AndroidHaptics.Clock_Tick);
  }, [matchedIndex]);
  const gradientColors = useMemo(() => ["#2c5364", "#203A43", "#0F2027"], []);
  const gradientPositions = useMemo(() => [0, 0.5, 1], []);

  if (!font || props.data?.length === 0) {
    return null; // Don't render until font is loaded
  }

  const chartHeight = props.landscape
    ? props.height - props.height / 5
    : props.height / 3;

  return (
    <View
      style={{
        width: props.width,
        height: chartHeight,
      }}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          height: chartHeight,
          width: props.data.length * barWidth + 150,
        }}
      >
        <CartesianChart
          frame={{
            lineColor: "transparent",
          }}
          actionsRef={ref}
          data={props.data}
          xKey="timestamp"
          yKeys={["price"]}
          padding={{
            left: 10,
            top: 0,
            bottom: 0,
            right: 10,
          }}
          domainPadding={{ left: 11, right: 18, top: 15, bottom: 0 }}
          axisOptions={{
            font,
            labelColor: "white",
            lineColor: "transparent",
          }}
          xAxis={{
            lineColor: "transparent",
            font,
            tickCount: props.data.length,
            enableRescaling: false,
            formatXLabel: (l) => {
              return tickFormatter(new Date(l), is15min);
            },
            tickValues: props.data.map((h) => h.timestamp),
            labelColor: "white",
          }}
          chartPressState={state}
          transformState={transformState}
          transformConfig={{
            pinch: { enabled: false },
            pan: {
              enabled: false,
            },
          }}
        >
          {({ points, chartBounds }) => {
            if (!points) {
              return null;
            }
            return points.price.map((price, index) => {
              const active =
                new Date(price.xValue).setMinutes(
                  is15min ? new Date(price.xValue).getMinutes() : 0,
                  0,
                  0
                ) ===
                new Date().setMinutes(
                  is15min ? Math.floor(new Date().getMinutes() / 15) * 15 : 0,
                  0,
                  0
                );
              return (
                <>
                  <Bar
                    key={price.xValue}
                    points={[price]}
                    chartBounds={chartBounds}
                    barWidth={barWidth}
                    roundedCorners={{
                      topLeft: barWidth,
                      topRight: barWidth,
                    }}
                    labels={{
                      font: font,
                      color: "white",
                      position: "top",
                      // @ts-ignore I added manually via patch
                      format: (value) => String(round(value)),
                    }}
                  >
                    <LinearGradient
                      start={vec(0, price.y)}
                      end={vec(0, chartBounds.bottom)}
                      colors={
                        (index == matchedIndex && isActive) || active
                          ? [
                              getGradientTopColor(
                                getColor(props.data[index]?.price)
                              ),
                              getGradientTopColor(
                                getColor(props.data[index]?.price)
                              ),
                              "#0F2027",
                            ]
                          : gradientColors
                      }
                      positions={gradientPositions}
                    />
                  </Bar>
                </>
              );
            });
          }}
        </CartesianChart>
      </ScrollView>
    </View>
  );
}
