import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--carbon)] p-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--ink)] text-[14px] font-[590] text-white" aria-hidden>P</span>
          <span className="text-[16px] font-[590] tracking-[-0.013em]">Pace</span>
        </div>
        <div className="card p-6">
          <h1 className="text-[20px] font-[590] tracking-[-0.012em]">Sign in</h1>
          <p className="mb-6 mt-1 text-[13px] text-[var(--muted)]">SYSVIT work tracking</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
