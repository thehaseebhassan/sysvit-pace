const s = { fill: "none" as const, stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function I({ children }: { children: React.ReactNode }) {
  return <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden {...s}>{children}</svg>;
}

export const icons = {
  issues: (
    <I>
      <path d="M2.5 3.5h11M2.5 8h11M2.5 12.5h7" />
    </I>
  ),
  projects: (
    <I>
      <path d="M2.5 4.5h4l1.2 1.5H13.5v6.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z" />
    </I>
  ),
  overview: (
    <I>
      <rect x="2.5" y="2.5" width="5" height="5" rx="0.8" />
      <rect x="8.5" y="2.5" width="5" height="3.2" rx="0.8" />
      <rect x="8.5" y="7.2" width="5" height="6.3" rx="0.8" />
      <rect x="2.5" y="9.2" width="5" height="4.3" rx="0.8" />
    </I>
  ),
  people: (
    <I>
      <circle cx="6" cy="5.2" r="2.2" />
      <path d="M2.2 13c.4-2.4 2.1-3.7 3.8-3.7S9.4 10.6 9.8 13" />
      <path d="M10.2 4.6a2.1 2.1 0 0 1 0 4.1" />
      <path d="M11.5 9.4c1.4.5 2.3 1.8 2.5 3.6" />
    </I>
  ),
  weekly: (
    <I>
      <path d="M3 12.5V7.5M6.5 12.5V4M10 12.5V8.5M13 12.5V5.5" />
    </I>
  ),
  sync: (
    <I>
      <path d="M13.2 7.2A5.2 5.2 0 0 0 4.2 4.6L2.8 6.2" />
      <path d="M2.8 2.8v3.4h3.4" />
      <path d="M2.8 8.8a5.2 5.2 0 0 0 9 2.6l1.4-1.6" />
      <path d="M13.2 13.2V9.8h-3.4" />
    </I>
  ),
  settings: (
    <I>
      <circle cx="8" cy="8" r="2.1" />
      <path d="M8 2.4v1.4M8 12.2v1.4M13.6 8h-1.4M3.8 8H2.4M12 4l-1 1M5 11l-1 1M12 12l-1-1M5 5 4 4" />
    </I>
  ),
  inbox: (
    <I>
      <path d="M2.5 8.5 4 3.5h8l1.5 5v4a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1z" />
      <path d="M2.5 8.5h3.2l.8 1.6h3l.8-1.6h3.2" />
    </I>
  ),
};
