function I({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d}
    </svg>
  );
}

export const icons = {
  overview: <I d={<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>} />,
  issues: <I d={<><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>} />,
  projects: <I d={<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />} />,
  people: <I d={<><circle cx="9" cy="8" r="3" /><path d="M3 20c.6-3.2 2.8-5 6-5s5.4 1.8 6 5" /><path d="M16 4.5a3 3 0 0 1 0 5.5M21 20c-.4-2.4-1.8-4-3.8-4.6" /></>} />,
  weekly: <I d={<path d="M4 19V10M10 19V5M16 19v-7M22 19H2" />} />,
  sync: <I d={<><path d="M21 12a9 9 0 0 0-15.5-6.3L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 15.5 6.3L21 16" /><path d="M21 21v-5h-5" /></>} />,
  settings: <I d={<><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M4.9 6.3l1.4 1.4M17.7 16.3l1.4 1.4M3 12h2M19 12h2M4.9 17.7l1.4-1.4M17.7 7.7l1.4-1.4" /></>} />,
};
