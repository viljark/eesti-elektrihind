import { Text, View } from "react-native";
import React, { useState, useEffect } from "react";
import {
  DailyAverages,
  getDailyPriceAverages,
} from "../services/getDailyPriceAverages";
import { getColor } from "../utils/colorUtils";
import { round } from "../../formatters";
import { VAT } from "../constants";
import { useSnapshot } from "valtio/react";
import { settingsState } from "./Settings";
import { MotiView } from "moti";
import { state } from "../../state";

interface Props {
  type: "today" | "tomorrow";
}

export function Average({ type }: Props) {
  const [averagePrice, setAveragePrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isVatEnabled } = useSnapshot(settingsState);
  const { appState } = useSnapshot(state);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const averages: DailyAverages = await getDailyPriceAverages();
        const price = type === "today" ? averages.today : averages.tomorrow;
        if (price === null) {
          setAveragePrice(price);
          return;
        }
        if (isVatEnabled) {
          setAveragePrice(round((price + price * VAT) / 10));
        } else {
          setAveragePrice(price / 10);
        }
      } catch (error) {
        console.error("Failed to fetch price averages:", error);
        // On error, the price remains null
        setAveragePrice(null);
      } finally {
        setIsLoading(false);
      }
    }
    if (appState === "active") {
      fetchData();
    }
  }, [type, isVatEnabled, appState]);

  const isToday = type === "today";

  let displayValue: string;
  let showUnit = false;

  if (averagePrice !== null) {
    displayValue = averagePrice.toFixed(2);
    showUnit = true;
  } else {
    // Fallback for missing/incomplete data
    displayValue = "andmed puuduvad";
    showUnit = false;
  }

  const priceColor = getColor(averagePrice);

  if (isLoading || averagePrice === null) {
    return null;
  }

  return (
    <MotiView
      transition={{ type: "timing", duration: 300 }}
      exitTransition={{ type: "timing", duration: 300 }}
      from={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      style={{
        position: "absolute",
        bottom: 0,
        left: isToday ? 12 : "auto",
        right: isToday ? "auto" : 12,
        alignItems: "flex-end",
        flexDirection: "row",
        paddingHorizontal: 8,
        gap: 3,
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_300Light",
          fontSize: 10,
          color: "white",
        }}
      >
        {isToday ? "täna" : "homme"}
      </Text>

      <Text
        style={{
          color: priceColor,
          fontFamily: "Inter_300Light",
          fontSize: 11,
        }}
      >
        {displayValue}
      </Text>

      {showUnit && (
        <Text
          style={{
            fontFamily: "Inter_300Light",
            fontSize: 10,
            color: "white",
          }}
        >
          s/kWh
        </Text>
      )}
    </MotiView>
  );
}
