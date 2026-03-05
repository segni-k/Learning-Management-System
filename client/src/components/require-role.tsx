"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Role = "admin" | "instructor" | "student";

type RequireRoleProps = {
  roles: Role[];
  children: React.ReactNode;
};

export function RequireRole({ roles, children }: RequireRoleProps) {
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

  if (!roles.includes((user.role as Role) ?? "student")) {
    return <div className="px-6 py-16 text-slate-300">Access denied.</div>;
  }

  return <>{children}</>;
}
