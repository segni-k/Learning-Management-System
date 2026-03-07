"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  if (user) {
    router.replace("/dashboard");
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setStatus(null);
    setIsSubmitting(true);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.push("/dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">LMS Client</p>
          <h1 className="text-3xl font-semibold">Create account</h1>
          <p className="text-sm text-slate-400">Start learning in minutes.</p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg"
        >
          <label className="grid gap-2 text-sm">
            Full name
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              disabled={isSubmitting}
              required
            />
          </label>
          <label className="mt-4 grid gap-2 text-sm">
            Email
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
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
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              disabled={isSubmitting}
              required
            />
          </label>
          <label className="mt-4 grid gap-2 text-sm">
            Confirm password
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              type="password"
              disabled={isSubmitting}
              required
            />
          </label>

          <button
            className="mt-6 w-full rounded-full bg-lime-300 px-5 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>

          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}
        </form>

        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link className="text-lime-200 hover:text-lime-100" href="/login">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
