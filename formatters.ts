export function formatHours(date: Date) {
  let hours = date.getHours();

  if (hours < 10) {
    return "0" + hours;
  }
  return String(hours);
}

export function round(nr: number) {
  return Math.round((nr + Number.EPSILON) * 100) / 100;
}
