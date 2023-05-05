export const getGradientTopColor = (color: string) => {
  switch (color) {
    case "magenta":
      return "#e722dd";
    case "red":
      return "#ff0000";
    case "yellow":
      return "#e3cc0a";
    case "lightgreen":
      return "#84c06c";
  }
  return "#bd5d78";
};

export const getGradient = (color: string) => {
  switch (color) {
    case "magenta":
      return ["#e722dd", "#7c4b6c", "#355C7D"];
    case "red":
      return ["#ff0000", "#6C5B7B", "#355C7D"];
    case "yellow":
      return ["#e3cc0a", "#7b785b", "#355C7D"];
    case "lightgreen":
      return ["#84c06c", "#5f7b5b", "#355C7D"];
  }
  return ["#C06C84", "#6C5B7B", "#355C7D"];
};

const absurd = 380;
const veryHigh = 19.2;
const high = 11.2;
const average = 5;
export const getColor = (price: number) => {
  return price >= absurd
    ? "magenta"
    : price >= veryHigh
    ? "red"
    : price >= high
    ? "yellow"
    : price >= average
    ? "lightgreen"
    : "lightgreen";
};

export const getNotificationIconColor = (price: number) => {
  return price >= absurd
    ? "magenta"
    : price >= veryHigh
    ? "red"
    : price >= high
    ? "yellow"
    : price >= average
    ? "green"
    : "green";
};
export const getNotificationTextColor = (price: number) => {
  return price >= absurd
    ? "#a100b2"
    : price >= veryHigh
    ? "#e10000"
    : price >= high
    ? "#FFA500"
    : price >= average
    ? "#009a42"
    : "#009a42";
};
