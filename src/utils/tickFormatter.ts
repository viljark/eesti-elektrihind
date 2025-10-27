import { formatHours, formatTime } from "../../formatters";
import _ from "lodash";

/**
 * Formats the tick label for a given date, conditionally showing the hour or minute.
 * - When is15min is false (default behavior), it shows the hour for every other hour
 * (alternating based on the current hour's parity).
 * - When is15min is true, it shows the minutes for every other 15-minute interval
 * (alternating based on the minutes' parity).
 *
 * @param date The date object for the tick.
 * @param is15min Flag to indicate if 15-minute support is active.
 * @returns The formatted hour or minute string, or an empty string.
 */
export function _tickFormatter(date: Date, is15min: boolean) {
  if (is15min) {
    // 15-minute support: Show minutes for every other 15-minute interval
    // The minutes will be 0, 15, 30, 45.
    const minutes = date.getMinutes();

    // Calculate the index of the 15-minute interval: 0, 1, 2, or 3.
    // We assume the date object's minutes are a multiple of 15 when is15min is true.
    const intervalIndex = minutes / 15;

    // Alternate based on the interval index parity (0, 2 are even; 1, 3 are odd)
    // You can choose to show even or odd intervals, for example, showing 00 and 30 minutes.
    // Here, we show labels for even interval indexes (0 for 00min, 2 for 30min).
    if (intervalIndex % 4 === 0) {
      // You might want a different formatter for minutes, but here we format as 'HH:MM'
      // and slice the minutes part, or use a specific minutes formatter if available.
      // Since formatHours is likely for hours, a simple minute display is used.
      const formattedTime = formatTime(date); // Assuming this returns something like "10:00"
      return formattedTime; // Extract the ":MM" part and remove the colon or just "MM"
      // If `formatHours` is just 'HH', you'll need a dedicated minute formatter.
      // Assuming a dedicated formatter or simple string based on your need:
      // return minutes.toString().padStart(2, '0');
    }
    return "";
  } else {
    // Original hourly alternating logic
    const now = new Date().getHours();
    const nowOdd = now % 2;
    return date.getHours() % 2 === nowOdd ? formatHours(date) : "";
  }
}

// Retain memoization for performance
export const tickFormatter = _.memoize(
  _tickFormatter,
  (value, is15min) =>
    // Include is15min in the memoization key to correctly differentiate results
    // when the flag changes for the same date object instance (less common but safe).
    `${value.getTime()}_${is15min}`
);
