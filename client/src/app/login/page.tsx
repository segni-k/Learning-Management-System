"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  if (user) {
    router.replace("/dashboard");
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">LMS Client</p>
          <h1 className="text-3xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-400">Access your learning dashboard.</p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg"
        >
          <label className="grid gap-2 text-sm">
            Email
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
              type="email"
              required
            />
          </label>
          <label className="mt-4 grid gap-2 text-sm">
            Password
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>

          <button
            className="mt-6 w-full rounded-full bg-lime-300 px-5 py-2 text-sm font-semibold text-slate-900"
            type="submit"
          >
            Sign in
          </button>

          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}
        </form>

        <p className="text-sm text-slate-400">
          New here?{" "}
          <Link className="text-lime-200 hover:text-lime-100" href="/register">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
