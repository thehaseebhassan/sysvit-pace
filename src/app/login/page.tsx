import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--bg-sidebar)] p-6">
      <div className="w-full max-w-sm space-y-5 rounded-lg border border-[var(--line)] bg-white p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-[var(--accent)] text-[10px] font-medium text-white">S</span>
          <div>
            <h1 className="text-[15px] font-medium">Pace</h1>
            <p className="text-[12px] text-[var(--muted)]">Sign in to SYSVIT</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
