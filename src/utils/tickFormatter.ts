import { formatHours } from "../../formatters";
import _ from "lodash";

export function _tickFormatter(date: Date) {
  const now = new Date().getHours();
  const nowOdd = now % 2;
  return date.getHours() % 2 === nowOdd ? formatHours(date) : "";
}

export const tickFormatter = _.memoize(_tickFormatter, (value) =>
  value.getTime()
);
