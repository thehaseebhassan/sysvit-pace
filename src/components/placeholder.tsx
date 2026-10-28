export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-zinc-500">{note}</p>
    </div>
  );
}
