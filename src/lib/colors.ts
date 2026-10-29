/**
 * Colours for labels and projects. Real values come from Linear during sync
 * (stored in workspaces.settings); anything unknown gets a stable colour from its name.
 */
export type UiColors = { labels: Record<string, string>; projects: Record<string, string> };

const PALETTE = ["#4ea7fc", "#f2c94c", "#27a644", "#bb87fc", "#f76b15", "#e5484d", "#02b8cc", "#6366f1"];
const HEX = /^#[0-9a-fA-F]{6}$/;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export const fallbackColor = (name: string) => PALETTE[hash(name.toLowerCase()) % PALETTE.length];

function clean(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object") return {};
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, c]) => typeof c === "string" && HEX.test(c))) as Record<string, string>;
}

export function uiColors(settings: Record<string, unknown> | null | undefined): UiColors {
  return { labels: clean(settings?.label_colors), projects: clean(settings?.project_colors) };
}

export const labelColor = (name: string, c?: UiColors) => c?.labels[name] ?? fallbackColor(name);
export const projectColor = (name: string, c?: UiColors) => c?.projects[name] ?? fallbackColor(name);

/** soft tint of a colour on white, e.g. for group headers */
export const tint = (hex: string, pct = 8) => `color-mix(in srgb, ${hex} ${pct}%, white)`;
