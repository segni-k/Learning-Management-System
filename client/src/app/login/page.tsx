"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    router.replace("/dashboard");
  }, [user, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setStatus(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Atlas LMS</p>
          <h1 className="text-3xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-400">Access your learning dashboard.</p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-2xl p-6"
        >
          <label className="grid gap-2 text-sm">
            Email
            <input
              className="rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-100"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
              type="email"
              disabled={isSubmitting}
              required
            />
          </label>
          <label className="mt-4 grid gap-2 text-sm">
            Password
            <input
              className="rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              disabled={isSubmitting}
              required
            />
          </label>

          <button
            className="mt-6 w-full rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}
        </form>

        <p className="text-sm text-slate-400">
          New here?{" "}
          <Link className="text-amber-200 hover:text-amber-100" href="/register">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
