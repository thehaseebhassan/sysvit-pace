function I({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      {children}
    </svg>
  );
}

export const icons = {
  overview: <I><rect x="2" y="2" width="5.2" height="5.2" rx="2" /><rect x="8.8" y="2" width="5.2" height="5.2" rx="2" /><rect x="2" y="8.8" width="5.2" height="5.2" rx="2" /><rect x="8.8" y="8.8" width="5.2" height="5.2" rx="2" /></I>,
  issues: <I><circle cx="8" cy="8" r="6.2" /><path d="m5.3 8.2 1.9 1.9 3.5-3.8" /></I>,
  projects: <I><path d="M7.2 1.8a1.7 1.7 0 0 1 1.6 0l4.3 2.45a1.7 1.7 0 0 1 .85 1.47v4.56a1.7 1.7 0 0 1-.85 1.47L8.8 14.2a1.7 1.7 0 0 1-1.6 0l-4.3-2.45a1.7 1.7 0 0 1-.85-1.47V5.72a1.7 1.7 0 0 1 .85-1.47z" /><path d="M2.4 4.9 8 8.1l5.6-3.2M8 8.1v6.2" /></I>,
  people: <I><circle cx="6.2" cy="5.4" r="2.5" /><path d="M1.9 13.6c.4-2.3 2-3.6 4.3-3.6s3.9 1.3 4.3 3.6" /><path d="M10.8 3.3a2.4 2.4 0 0 1 0 4.3M12.4 10.2c1 .5 1.7 1.6 1.8 3.2" /></I>,
  weekly: <I><path d="M3.8 13V9.5M8 13V3.5M12.2 13V6.5" strokeWidth="2.2" /></I>,
  sync: <I><path d="M13.5 8a5.5 5.5 0 0 0-9.6-3.6L2.6 5.8" /><path d="M2.6 2.6v3.2h3.2" /><path d="M2.5 8a5.5 5.5 0 0 0 9.6 3.6l1.3-1.4" /><path d="M13.4 13.4v-3.2h-3.2" /></I>,
  settings: <I><path d="M2.5 5h5.2M11.4 5h2.1M2.5 11h2.1M8.3 11h5.2" /><circle cx="9.5" cy="5" r="1.7" /><circle cx="6.5" cy="11" r="1.7" /></I>,
};
