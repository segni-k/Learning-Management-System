"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
  UserCog,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getStudentNotificationSummary } from "@/lib/student";

const NOTIFICATION_SYNC_EVENT = "atlas-notifications-updated";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("atlas-theme");
    return stored === "light" || stored === "dark" ? stored : "light";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("atlas-theme", theme);
  }, [theme]);

  const fetchNotificationSummary = useCallback(async () => {
    const response = await getStudentNotificationSummary();

    return response.data.unread_count;
  }, []);

  useEffect(() => {
    if (user?.role !== "student") {
      return;
    }

    let active = true;

    void fetchNotificationSummary()
      .then((count) => {
        if (active) {
          setUnreadCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setUnreadCount(0);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchNotificationSummary, user?.role]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleNotificationsUpdated = () => {
      if (user?.role !== "student") {
        return;
      }

      void fetchNotificationSummary()
        .then((count) => {
          setUnreadCount(count);
        })
        .catch(() => {
          setUnreadCount(0);
        });
    };

    window.addEventListener(NOTIFICATION_SYNC_EVENT, handleNotificationsUpdated);

    return () => {
      window.removeEventListener(NOTIFICATION_SYNC_EVENT, handleNotificationsUpdated);
    };
  }, [fetchNotificationSummary, user?.role]);

  const notificationBadgeCount = user?.role === "student" ? unreadCount : 0;
  const currentSearchQuery = searchParams.get("search") ?? "";

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("search") ?? "").trim();

    if (!query) {
      router.push("/courses");
      return;
    }

    router.push(`/courses?search=${encodeURIComponent(query)}`);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/courses", label: "Courses", icon: BookOpen, show: true },
    { href: "/student/coursework", label: "Coursework", icon: ClipboardList, show: user?.role === "student" },
    { href: "/student/enrollments", label: "Enrollments", icon: GraduationCap, show: user?.role === "student" },
    { href: "/student/activity", label: "Activity", icon: Activity, show: user?.role === "student" },
    { href: "/student/notifications", label: "Notifications", icon: Bell, show: user?.role === "student" },
    { href: "/instructor/courses", label: "Instructor", icon: UserCog, show: user?.role === "instructor" || user?.role === "admin" },
    { href: "/instructor/analytics", label: "Analytics", icon: BarChart3, show: user?.role === "instructor" || user?.role === "admin" },
    { href: "/instructor/activity", label: "Instructor Activity", icon: Activity, show: user?.role === "instructor" || user?.role === "admin" },
    { href: "/admin/analytics", label: "Admin", icon: Shield, show: user?.role === "admin" },
  ].filter((link) => link.show);

  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0">
        <div className="bg-blob-1 absolute left-[-20%] top-[-10%] h-[320px] w-[320px] rounded-full blur-[120px]" />
        <div className="bg-blob-2 absolute right-[-15%] top-[10%] h-[380px] w-[380px] rounded-full blur-[140px]" />
        <div className="bg-blob-3 absolute bottom-[-20%] left-[20%] h-[420px] w-[420px] rounded-full blur-[160px]" />
      </div>
      <header className="app-shell-header sticky top-0 z-20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link className="flex items-center gap-2.5 font-display text-lg sm:text-xl" href="/">
            <span className="app-shell-logo inline-flex h-8 w-8 items-center justify-center rounded-full text-sm sm:h-9 sm:w-9 sm:text-base">
              A
            </span>
            Atlas LMS
          </Link>

          <nav className="hidden items-center gap-3 text-sm md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} className="app-shell-link inline-flex items-center gap-1.5" href={link.href}>
                <span className="relative inline-flex">
                  <link.icon size={15} strokeWidth={2} />
                  {link.href === "/student/notifications" && notificationBadgeCount > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center">
                      <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-red-500/30 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-white/80 bg-red-500" />
                    </span>
                  ) : null}
                </span>
                <span>{link.label}</span>
                {link.href === "/student/notifications" && notificationBadgeCount > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(239,68,68,0.28)]">
                    {notificationBadgeCount > 99 ? "99+" : notificationBadgeCount}
                  </span>
                ) : null}
              </Link>
            ))}
            {user?.role === "instructor" || user?.role === "admin" ? (
              <span className="app-shell-pill rounded-full px-3 py-1 text-[11px]">
                Instructor view
              </span>
            ) : null}
            <button
              className="app-shell-pill rounded-full px-3 py-1 text-[11px] inline-flex items-center gap-1.5"
              type="button"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </button>
            {loading ? (
              <span className="app-shell-link">Checking...</span>
            ) : user ? (
              <button
                className="app-shell-pill rounded-full px-4 py-1 text-xs inline-flex items-center gap-1.5"
                type="button"
                onClick={() => void logout()}
              >
                <LogOut size={14} />
                Sign out
              </button>
            ) : (
              <Link className="rounded-full px-4 py-1 text-xs font-semibold ui-btn-primary inline-flex items-center gap-1.5" href="/login">
                <LogIn size={14} />
                Sign in
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button
              className="app-shell-pill rounded-full px-3 py-1.5 text-[11px] inline-flex items-center gap-1"
              type="button"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button
              className="app-shell-pill rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1"
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        <div className="hidden border-t border-[color:color-mix(in_srgb,var(--border)_70%,transparent)] lg:block">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
            <form className="app-shell-search w-full max-w-3xl" onSubmit={handleSearchSubmit} role="search">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                key={`desktop-search-${pathname}-${currentSearchQuery}`}
                name="search"
                aria-label="Search courses"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                type="search"
                placeholder="Search by course title, level, instructor, or keyword"
                defaultValue={currentSearchQuery}
              />
              {currentSearchQuery ? (
                <button
                  className="app-shell-search-clear"
                  type="button"
                  onClick={() => router.push("/courses")}
                >
                  Clear
                </button>
              ) : null}
              <button className="app-shell-search-btn" type="submit">
                Search
              </button>
            </form>
            <p className="hidden text-xs text-slate-500 xl:block">
              Discover courses faster with a focused search experience.
            </p>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] px-4 pb-4 pt-3 md:hidden">
            <div className="grid gap-2">
              <form className="app-shell-search mb-2" onSubmit={handleSearchSubmit} role="search">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  key={`mobile-search-${pathname}-${currentSearchQuery}`}
                  name="search"
                  aria-label="Search courses"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  type="search"
                  placeholder="Search courses"
                  defaultValue={currentSearchQuery}
                />
                {currentSearchQuery ? (
                  <button
                    className="app-shell-search-clear"
                    type="button"
                    onClick={() => router.push("/courses")}
                  >
                    Clear
                  </button>
                ) : null}
                <button className="app-shell-search-btn" type="submit">
                  Go
                </button>
              </form>

              {navLinks.map((link) => (
                <Link
                  key={`mobile-${link.href}`}
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-16">
                  <div className="grid gap-8 rounded-[2rem] border border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_92%,transparent)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[1.2fr_0.9fr] lg:p-8">
                    <div className="space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Atlas LMS</p>
                      <h2 className="max-w-2xl text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                        Build structured learning experiences with one production-ready workspace.
                      </h2>
                      <p className="max-w-2xl text-sm leading-6 text-slate-500">
                        Atlas LMS brings together enrollment, coursework, notifications, progress tracking, and role-based dashboards for students, instructors, and administrators.
                      </p>
                      <div className="flex flex-wrap gap-3 pt-1 text-xs text-slate-500">
                        <span className="app-shell-pill rounded-full px-3 py-1">Role-based access</span>
                        <span className="app-shell-pill rounded-full px-3 py-1">Course analytics</span>
                        <span className="app-shell-pill rounded-full px-3 py-1">Learner progress tracking</span>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Learners</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">1.2k+</p>
                        <p className="mt-1 text-xs text-slate-500">active students across guided programs</p>
                      </div>
                      <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Completion</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">84%</p>
                        <p className="mt-1 text-xs text-slate-500">average course completion visibility</p>
                      </div>
                      <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Support</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">24/7</p>
                        <p className="mt-1 text-xs text-slate-500">platform monitoring and response readiness</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-10 lg:grid-cols-[1.2fr_0.85fr_0.85fr_0.85fr_1fr] lg:gap-8">
                    <div className="space-y-4">
                      <Link className="flex items-center gap-2.5 font-display text-lg" href="/">
                        <span className="app-shell-logo inline-flex h-9 w-9 items-center justify-center rounded-full text-sm">
                          A
                        </span>
                        Atlas LMS
                      </Link>
                      <p className="max-w-sm text-sm leading-6 text-slate-500">
                        A focused LMS for courses, assessments, dashboards, notifications, progress tracking, and instructor workflows with a clean modern interface.
                      </p>
                      <div className="space-y-2 text-sm text-slate-500">
                        <p><span className="font-semibold text-slate-700 dark:text-slate-200">Email:</span> support@atlaslms.app</p>
                        <p><span className="font-semibold text-slate-700 dark:text-slate-200">Availability:</span> Mon–Sun · platform coverage</p>
                        <p><span className="font-semibold text-slate-700 dark:text-slate-200">Region:</span> Global remote learning support</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Learn</h2>
                      <div className="grid gap-2 text-sm">
                        <Link className="app-shell-link" href="/courses">Browse courses</Link>
                        <Link className="app-shell-link" href="/dashboard">Dashboard</Link>
                        <Link className="app-shell-link" href="/student/coursework">Assignments & quizzes</Link>
                        <Link className="app-shell-link" href="/student/enrollments">My learning</Link>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Roles</h2>
                      <div className="grid gap-2 text-sm text-slate-500">
                        <p>Students follow a clear learning path with progress tracking.</p>
                        <p>Instructors manage delivery, coursework, and analytics.</p>
                        <p>Admins monitor platform-wide outcomes and engagement.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Platform</h2>
                      <div className="grid gap-2 text-sm">
                        <Link className="app-shell-link" href="/student/notifications">Notifications</Link>
                        <Link className="app-shell-link" href="/student/activity">Activity feed</Link>
                        <Link className="app-shell-link" href="/instructor/analytics">Analytics</Link>
                        <Link className="app-shell-link" href="/instructor/courses">Instructor tools</Link>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Trust & operations</h2>
                      <div className="grid gap-2 text-sm text-slate-500">
                        <p>Role-based access and protected course operations.</p>
                        <p>Notification read tracking and learner activity history.</p>
                        <p>Responsive UX for desktop, tablet, and mobile study flows.</p>
                        <p>Performance-focused student queries and indexed reporting.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--border)_78%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] px-5 py-4 text-sm text-slate-500 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <p>Atlas LMS is built for production-minded learning teams who need clarity across courses, coursework, communication, and completion.</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">Version 1.0 · March 2026</p>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <span>© 2026 Atlas LMS</span>
                      <span>All rights reserved</span>
                    </div>
                  </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="app-shell-pill rounded-full px-3 py-1">Trusted learning workspace</span>
              <span className="app-shell-pill rounded-full px-3 py-1">Student-first experience</span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Explore</h2>
            <div className="grid gap-2 text-sm">
              <Link className="app-shell-link" href="/courses">Browse courses</Link>
                  className="app-shell-link app-shell-pill rounded-xl px-4 py-3 text-sm inline-flex items-center gap-2"
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="relative inline-flex">
                    <link.icon size={16} strokeWidth={2} />
                    {link.href === "/student/notifications" && notificationBadgeCount > 0 ? (
                      <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center">
                        <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-red-500/30 animate-ping" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-white/80 bg-red-500" />
                      </span>
                    ) : null}
                  </span>
                  {link.label}
                  {link.href === "/student/notifications" && notificationBadgeCount > 0 ? (
                    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(239,68,68,0.28)]">
                      {notificationBadgeCount > 99 ? "99+" : notificationBadgeCount}
                    </span>
                  ) : null}
                </Link>
              ))}

              {loading ? (
                <span className="app-shell-link app-shell-pill rounded-xl px-4 py-3 text-sm">Checking...</span>
              ) : user ? (
                <button
                  className="app-shell-pill rounded-xl px-4 py-3 text-left text-sm inline-flex items-center gap-2"
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              ) : (
                <Link
                  className="ui-btn-primary rounded-xl px-4 py-3 text-center text-sm font-semibold inline-flex items-center justify-center gap-2"
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn size={16} />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>
      <div className="min-h-[calc(100vh-80px)]">{children}</div>
      <footer className="border-t border-[color:color-mix(in_srgb,var(--border)_75%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_95%,transparent)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-8 rounded-[2rem] border border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_92%,transparent)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[1.2fr_0.9fr] lg:p-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Atlas LMS</p>
              <h2 className="max-w-2xl text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                Build structured learning experiences with one production-ready workspace.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Atlas LMS brings together enrollment, coursework, notifications, progress tracking, and role-based dashboards for students, instructors, and administrators.
              </p>
              <div className="flex flex-wrap gap-3 pt-1 text-xs text-slate-500">
                <span className="app-shell-pill rounded-full px-3 py-1">Role-based access</span>
                <span className="app-shell-pill rounded-full px-3 py-1">Course analytics</span>
                <span className="app-shell-pill rounded-full px-3 py-1">Learner progress tracking</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Learners</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">1.2k+</p>
                <p className="mt-1 text-xs text-slate-500">active students across guided programs</p>
              </div>
              <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Completion</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">84%</p>
                <p className="mt-1 text-xs text-slate-500">average course completion visibility</p>
              </div>
              <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Support</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">24/7</p>
                <p className="mt-1 text-xs text-slate-500">platform monitoring and response readiness</p>
              </div>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.85fr_0.85fr_0.85fr_1fr] lg:gap-8">
            <div className="space-y-4">
              <Link className="flex items-center gap-2.5 font-display text-lg" href="/">
                <span className="app-shell-logo inline-flex h-9 w-9 items-center justify-center rounded-full text-sm">
                  A
                </span>
                Atlas LMS
              </Link>
              <p className="max-w-sm text-sm leading-6 text-slate-500">
                A focused LMS for courses, assessments, dashboards, notifications, progress tracking, and instructor workflows with a clean modern interface.
              </p>
              <div className="space-y-2 text-sm text-slate-500">
                <p><span className="font-semibold text-slate-700 dark:text-slate-200">Email:</span> support@atlaslms.app</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-200">Availability:</span> Mon–Sun · platform coverage</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-200">Region:</span> Global remote learning support</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Learn</h2>
              <div className="grid gap-2 text-sm">
                <Link className="app-shell-link" href="/courses">Browse courses</Link>
                <Link className="app-shell-link" href="/dashboard">Dashboard</Link>
                <Link className="app-shell-link" href="/student/coursework">Assignments & quizzes</Link>
                <Link className="app-shell-link" href="/student/enrollments">My learning</Link>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Roles</h2>
              <div className="grid gap-2 text-sm text-slate-500">
                <p>Students follow a clear learning path with progress tracking.</p>
                <p>Instructors manage delivery, coursework, and analytics.</p>
                <p>Admins monitor platform-wide outcomes and engagement.</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Platform</h2>
              <div className="grid gap-2 text-sm">
                <Link className="app-shell-link" href="/student/notifications">Notifications</Link>
                <Link className="app-shell-link" href="/student/activity">Activity feed</Link>
                <Link className="app-shell-link" href="/instructor/analytics">Analytics</Link>
                <Link className="app-shell-link" href="/instructor/courses">Instructor tools</Link>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Trust & operations</h2>
              <div className="grid gap-2 text-sm text-slate-500">
                <p>Role-based access and protected course operations.</p>
                <p>Notification read tracking and learner activity history.</p>
                <p>Responsive UX for desktop, tablet, and mobile study flows.</p>
                <p>Performance-focused student queries and indexed reporting.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--border)_78%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] px-5 py-4 text-sm text-slate-500 md:grid-cols-[1fr_auto_auto] md:items-center">
            <p>Atlas LMS is built for production-minded learning teams who need clarity across courses, coursework, communication, and completion.</p>
            <p className="font-medium text-slate-700 dark:text-slate-200">Version 1.0 · March 2026</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <span>© 2026 Atlas LMS</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
