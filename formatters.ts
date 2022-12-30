export function formatHours(date: Date) {
  const hours = date.getHours();

  if (hours < 10) {
    return "0" + hours;
  }
  return String(hours);
}

export function round(nr: number) {
  return Math.round((nr + Number.EPSILON) * 1000) / 1000;
}
