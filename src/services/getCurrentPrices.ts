export async function getCurrentPrices(withHistory = false) {
  const now = new Date();
  let start = new Date();
  now.setMinutes(0);
  now.setSeconds(0);
  now.setMilliseconds(0);
  start.setMinutes(0);
  start.setSeconds(0);
  start.setMilliseconds(0);
  if (withHistory) {
    start = new Date(start.getTime() - 1000 * 60 * 60 * 6);
  }
  const end = new Date(start.getTime() + 1000 * 60 * 60 * 23);
  const response: InputData = await fetch(
    "https://dashboard.elering.ee/api/nps/price?" +
      new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      }),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((res) => res.json());

  return calculateHourlyAverage(response);
}

interface PriceDataPoint {
  timestamp: number;
  price: number;
}

interface InputData {
  success: boolean;
  data: {
    ee: PriceDataPoint[];
  };
}

interface HourlyAverage {
  timestamp: number;
  price: number;
}

function calculateHourlyAverage(data: InputData): HourlyAverage[] {
  const prices = data.data.ee;

  // 1. Group prices by the hour
  // The key is the standardized ISO string for the start of the hour
  const hourlyGroups = new Map<number, number[]>();

  for (const entry of prices) {
    // Convert the Unix timestamp (seconds) to a Date object
    const date = new Date(entry.timestamp * 1000);

    // Standardize the date to the start of the hour (setting minutes, seconds, ms to 0)
    // This is crucial for consistent grouping.
    date.setMinutes(0, 0, 0);

    const hourKey = date.getTime();

    if (!hourlyGroups.has(hourKey)) {
      hourlyGroups.set(hourKey, []);
    }

    hourlyGroups.get(hourKey)!.push(entry.price);
  }

  const result: HourlyAverage[] = [];

  for (const [hour, prices] of hourlyGroups.entries()) {
    const sum = prices.reduce((acc, price) => acc + price, 0);
    const average = sum / prices.length;

    result.push({
      timestamp: hour / 1000, // convert back to original api format
      price: Number(average.toFixed(4)),
    });
  }

  // Sort the results chronologically
  return result.sort((a, b) => a.timestamp - b.timestamp);
}
