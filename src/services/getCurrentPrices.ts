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
  const response = await fetch(
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

  return response.data.ee;
}
