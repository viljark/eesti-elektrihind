export function formatHours(date: Date) {
  const hours = date.getHours();

  if (hours < 10) {
    return "0" + hours;
  }
  return String(hours);
}

export function formatTime(date: Date): string {
  // 1. Round to the nearest 15 minutes
  const ms = 1000 * 60 * 15; // Milliseconds in 15 minutes
  const roundedTime = new Date(Math.round(date.getTime() / ms) * ms);

  // 2. Extract hours and minutes from the rounded time
  const hours = roundedTime.getHours();
  const minutes = roundedTime.getMinutes();

  // 3. Format hours (HH)
  const formattedHours = hours < 10 ? "0" + hours : String(hours);

  // 4. Format minutes (MM)
  // Minutes will always be a multiple of 15 (0, 15, 30, 45) after rounding.
  const formattedMinutes = minutes < 10 ? "0" + minutes : String(minutes);

  // 5. Return the full formatted time
  return `${formattedHours}:${formattedMinutes}`;
}

export function round(nr: number) {
  return Math.round((nr + Number.EPSILON) * 1000) / 1000;
}
