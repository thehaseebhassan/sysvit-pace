import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-zinc-200 p-8 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pace</h1>
          <p className="text-sm text-zinc-500">Sign in to SYSVIT</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
