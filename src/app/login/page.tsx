import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--accent)] text-[12px] font-semibold text-white">P</span>
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
