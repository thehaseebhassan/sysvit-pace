function I({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      {children}
    </svg>
  );
}

export const icons = {
  overview: <I><rect x="2" y="2" width="5" height="5" rx="1.2" /><rect x="9" y="2" width="5" height="5" rx="1.2" /><rect x="2" y="9" width="5" height="5" rx="1.2" /><rect x="9" y="9" width="5" height="5" rx="1.2" /></I>,
  issues: <I><circle cx="8" cy="8" r="6" /><path d="m5.5 8.2 1.7 1.7 3.3-3.6" /></I>,
  projects: <I><path d="m8 1.8 5.5 3.1v6.2L8 14.2l-5.5-3.1V4.9z" /><path d="M2.7 5 8 8l5.3-3M8 8v6" /></I>,
  people: <I><circle cx="6" cy="5.5" r="2.4" /><path d="M1.8 13.5c.4-2.4 2-3.7 4.2-3.7s3.8 1.3 4.2 3.7" /><path d="M10.6 3.4a2.3 2.3 0 0 1 0 4.2M12.3 9.9c1 .5 1.7 1.6 1.9 3.1" /></I>,
  weekly: <I><path d="M3 13V8M8 13V3M13 13V6" /></I>,
  sync: <I><path d="M13.5 8a5.5 5.5 0 0 0-9.7-3.5L2.5 6" /><path d="M2.5 2.5V6H6" /><path d="M2.5 8a5.5 5.5 0 0 0 9.7 3.5l1.3-1.5" /><path d="M13.5 13.5V10H10" /></I>,
  settings: <I><circle cx="8" cy="8" r="2" /><path d="M8 1.8v1.5M8 12.7v1.5M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M1.8 8h1.5M12.7 8h1.5M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1" /></I>,
};
