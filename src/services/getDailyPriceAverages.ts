import { API_URL, InputData, PriceDataPoint } from "./getCurrentPrices";
import { round } from "../../formatters";

export interface DailyAverages {
  today: number | null;
  tomorrow: number | null;
}

/**
 * Calculates the Unix timestamp (in milliseconds) for the start of the local day (00:00:00.000).
 * @param date A Date object.
 * @returns The timestamp for midnight of that day.
 */
const startOfDayTimestamp = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Groups price data by the local day and calculates the average price for today and tomorrow.
 * @param data Array of PriceDataPoint from the API.
 * @returns An object containing the rounded average price for today and tomorrow, or null.
 */
function calculateDailyAverages(data: PriceDataPoint[]): DailyAverages {
  const now = new Date();
  const todayMidnight = startOfDayTimestamp(now);
  const tomorrowMidnight = todayMidnight + 1000 * 60 * 60 * 24;

  const todayPrices: number[] = [];
  const tomorrowPrices: number[] = [];

  data.forEach((item) => {
    const priceDate = startOfDayTimestamp(new Date(item.timestamp * 1000));
    if (priceDate === todayMidnight) {
      todayPrices.push(item.price);
    } else if (priceDate === tomorrowMidnight) {
      tomorrowPrices.push(item.price);
    }
  });

  const getAverage = (prices: number[]): number | null => {
    if (prices.length < 24) {
      return null;
    }
    const sum = prices.reduce((a, b) => a + b, 0);
    return round(sum / prices.length);
  };

  return {
    today: getAverage(todayPrices),
    tomorrow: getAverage(tomorrowPrices),
  };
}

/**
 * Fetches price data for today and tomorrow (48 hours) and returns the daily averages.
 */
export async function getDailyPriceAverages(): Promise<DailyAverages> {
  // Calculate today's 00:00:00.000 (start)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Calculate day after tomorrow's 00:00:00.000 (end)
  // This covers the full 48 hours for today and tomorrow.
  const end = new Date(todayStart.getTime() + 1000 * 60 * 60 * 48);

  const response: InputData = await fetch(
    API_URL +
      "/api/nps/price?" +
      new URLSearchParams({
        // API expects ISO string. We send the full local 48-hour window.
        start: todayStart.toISOString(),
        end: end.toISOString(),
      }),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((res) => res.json());

  if (!response.success) {
    throw new Error("API call failed: Response success is false.");
  }

  return calculateDailyAverages(response.data.ee);
}
