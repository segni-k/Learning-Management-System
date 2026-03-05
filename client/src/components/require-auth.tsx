"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="px-6 py-16 text-slate-300">Loading session...</div>;
  }

  if (!user) {
    return <div className="px-6 py-16 text-slate-300">Redirecting...</div>;
  }

  return <>{children}</>;
}
