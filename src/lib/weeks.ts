/** Week helpers: weeks run Monday-Sunday in the workspace timezone (default Melbourne). */
export const DEFAULT_TZ = "Australia/Melbourne";

/** YYYY-MM-DD of an instant as seen in `tz`. */
export function dateInTz(d: Date | string, tz = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
}

/** Monday (YYYY-MM-DD) of the week containing the given instant, in `tz`. */
export function weekStart(d: Date | string, tz = DEFAULT_TZ): string {
  const [y, m, day] = dateInTz(d, tz).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  const back = (dt.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  dt.setUTCDate(dt.getUTCDate() - back);
  return dt.toISOString().slice(0, 10);
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function formatWeekRange(start: string): string {
  const fmt = (ymd: string) =>
    new Date(ymd + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(addDays(start, 6))}`;
}
