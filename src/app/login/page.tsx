import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] p-8">
        <p className="text-lg font-semibold tracking-tight">Pace</p>
        <p className="mt-1 mb-6 text-sm text-[var(--muted)]">Sign in to SYSVIT</p>
        <LoginForm />
      </div>
    </main>
  );
}
