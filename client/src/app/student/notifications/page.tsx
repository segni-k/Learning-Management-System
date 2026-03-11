"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Bell, BookOpen, CheckCheck, ChevronRight, ClipboardList, FileQuestion } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { listStudentNotifications, markStudentNotificationsRead } from "@/lib/student";
import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/card";
import type { NotificationItem, StudentNotifications } from "@/lib/types";

const NOTIFICATION_SYNC_EVENT = "atlas-notifications-updated";

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<StudentNotifications | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await listStudentNotifications();
        setNotifications(response.data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load notifications");
      }
    };

    void load();
  }, []);

  const dispatchNotificationUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(NOTIFICATION_SYNC_EVENT));
    }
  };

  const markAsRead = async (items: NotificationItem[]) => {
    const unreadItems = items.filter((item) => !item.is_read).map((item) => ({ type: item.type, id: item.id }));

    if (!unreadItems.length) {
      return;
    }

    try {
      await markStudentNotificationsRead(unreadItems);
      setNotifications((current) => {
        if (!current) return current;

        const markList = (list: NotificationItem[]) =>
          list.map((item) =>
            unreadItems.some((entry) => entry.type === item.type && entry.id === item.id)
              ? { ...item, is_read: true }
              : item
          );

        const next = {
          ...current,
          upcoming_assignments: markList(current.upcoming_assignments),
          new_lessons: markList(current.new_lessons),
          new_quizzes: markList(current.new_quizzes),
        };

        const unreadCount = [
          ...next.upcoming_assignments,
          ...next.new_lessons,
          ...next.new_quizzes,
        ].filter((item) => !item.is_read).length;

        return {
          ...next,
          summary: {
            unread_count: unreadCount,
            total_count: next.summary.total_count,
          },
        };
      });
      dispatchNotificationUpdate();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update notifications");
    }
  };

  const handleMarkAllRead = async () => {
    if (!notifications) return;

    const allItems = [
      ...notifications.upcoming_assignments,
      ...notifications.new_lessons,
      ...notifications.new_quizzes,
    ];

    setBusy(true);
    await markAsRead(allItems);
    setBusy(false);
  };

  const renderNotificationCard = (
    item: NotificationItem,
    href: string,
    meta: string,
    Icon: LucideIcon,
    label: string
  ) => (
    <Link
      key={`${item.type}-${item.id}`}
      href={href}
      className="block"
      onClick={() => {
        void markAsRead([item]);
      }}
    >
      <Card
        className={`group relative overflow-hidden rounded-[1.35rem] border p-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${
          item.is_read
            ? "border-[color:color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_94%,transparent)] opacity-90"
            : "border-red-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,245,245,0.96))] shadow-[0_18px_40px_rgba(239,68,68,0.10)] dark:border-red-500/30 dark:bg-[linear-gradient(135deg,rgba(35,18,22,0.96),rgba(22,15,18,0.96))]"
        }`}
      >
        {!item.is_read ? (
          <span className="absolute inset-y-0 left-0 w-1 rounded-l-[1.35rem] bg-red-500" />
        ) : null}
        <div className="flex items-start gap-3 p-4">
          <div
            className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
              item.is_read
                ? "border-[color:color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] text-slate-500"
                : "border-red-200 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            }`}
          >
            <Icon size={18} />
            {!item.is_read ? <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" /> : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    item.is_read
                      ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-red-500 text-white shadow-[0_10px_22px_rgba(239,68,68,0.24)]"
                  }`}>
                    {item.is_read ? "Read" : "Unread"}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {label}
                  </span>
                </div>
                <p className={`text-sm font-semibold sm:text-[15px] ${item.is_read ? "text-slate-700 dark:text-slate-100" : "text-slate-900 dark:text-white"}`}>
                  {item.title}
                </p>
                <p className="text-xs text-slate-500">{meta}</p>
              </div>

              {!item.is_read ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  New
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[color:color-mix(in_srgb,var(--border)_70%,transparent)] pt-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-500">
                  {item.course?.title ?? "Atlas LMS"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                Open
                <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student</p>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
            <Bell size={22} /> Notifications
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-400">Upcoming deadlines and new content, styled with a clearer unread feed.</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500/40 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              {notifications?.summary.unread_count ?? 0} unread
            </span>
            <button
              className="ui-btn-secondary inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={busy || !notifications?.summary.unread_count}
              onClick={() => void handleMarkAllRead()}
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          </div>
          <Link className="inline-flex items-center gap-1 text-xs text-amber-300" href="/dashboard">
            <ClipboardList size={14} />
            Back to dashboard
          </Link>
        </header>

        {status && <p className="text-sm text-rose-300">{status}</p>}

        <section className="grid gap-6 lg:grid-cols-3">
          <Panel>
            <div className="flex items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><ClipboardList size={18} /> Upcoming assignments</h2>
              <span className="text-xs font-semibold text-slate-400">{notifications?.upcoming_assignments.filter((item) => !item.is_read).length ?? 0} unread</span>
            </div>
            <div className="mt-4 space-y-3">
              {(notifications?.upcoming_assignments ?? []).map((item) => (
                renderNotificationCard(item, item.course?.id ? `/courses/${item.course.id}` : "/dashboard", `Due ${item.due_at ?? "-"}`, ClipboardList, "Assignment")
              ))}
              {!(notifications?.upcoming_assignments ?? []).length && (
                <p className="text-sm text-slate-400">No upcoming assignments.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><BookOpen size={18} /> New lessons</h2>
              <span className="text-xs font-semibold text-slate-400">{notifications?.new_lessons.filter((item) => !item.is_read).length ?? 0} unread</span>
            </div>
            <div className="mt-4 space-y-3">
              {(notifications?.new_lessons ?? []).map((item) => (
                renderNotificationCard(item, item.course?.id ? `/courses/${item.course.id}` : "/dashboard", `Added ${item.created_at ?? "-"}`, BookOpen, "Lesson")
              ))}
              {!(notifications?.new_lessons ?? []).length && (
                <p className="text-sm text-slate-400">No new lessons.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><FileQuestion size={18} /> New quizzes</h2>
              <span className="text-xs font-semibold text-slate-400">{notifications?.new_quizzes.filter((item) => !item.is_read).length ?? 0} unread</span>
            </div>
            <div className="mt-4 space-y-3">
              {(notifications?.new_quizzes ?? []).map((item) => (
                renderNotificationCard(item, item.course?.id ? `/courses/${item.course.id}` : "/dashboard", `Added ${item.created_at ?? "-"}`, FileQuestion, "Quiz")
              ))}
              {!(notifications?.new_quizzes ?? []).length && (
                <p className="text-sm text-slate-400">No new quizzes.</p>
              )}
            </div>
          </Panel>
        </section>
      </main>
    </RequireAuth>
  );
}
