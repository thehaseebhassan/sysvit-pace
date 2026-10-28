import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-indigo-50/60 to-transparent p-6">
      <div className="fade-up w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">P</span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Pace</h1>
            <p className="text-sm text-zinc-500">Sign in to SYSVIT</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
