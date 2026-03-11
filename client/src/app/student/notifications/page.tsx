"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, CheckCheck, ClipboardList, FileQuestion } from "lucide-react";
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

  const renderNotificationCard = (item: NotificationItem, href: string, meta: string) => (
    <Link
      key={`${item.type}-${item.id}`}
      href={href}
      className="block"
      onClick={() => {
        void markAsRead([item]);
      }}
    >
      <Card
        className={`p-3 transition ${
          item.is_read
            ? ""
            : "border-[color:var(--brand)] bg-[color:color-mix(in_srgb,var(--brand-soft)_70%,var(--surface))]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-slate-500">{meta}</p>
          </div>
          {!item.is_read ? <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[var(--brand)]" /> : null}
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
            <p className="text-sm text-slate-400">Upcoming deadlines and new content.</p>
            <span className="ui-badge">{notifications?.summary.unread_count ?? 0} unread</span>
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
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><ClipboardList size={18} /> Upcoming assignments</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.upcoming_assignments ?? []).map((item) => (
                renderNotificationCard(item, item.course?.id ? `/courses/${item.course.id}` : "/dashboard", `Due ${item.due_at ?? "-"}`)
              ))}
              {!(notifications?.upcoming_assignments ?? []).length && (
                <p className="text-sm text-slate-400">No upcoming assignments.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><BookOpen size={18} /> New lessons</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.new_lessons ?? []).map((item) => (
                renderNotificationCard(item, item.course?.id ? `/courses/${item.course.id}` : "/dashboard", `Added ${item.created_at ?? "-"}`)
              ))}
              {!(notifications?.new_lessons ?? []).length && (
                <p className="text-sm text-slate-400">No new lessons.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><FileQuestion size={18} /> New quizzes</h2>
            <div className="mt-4 space-y-3">
              {(notifications?.new_quizzes ?? []).map((item) => (
                renderNotificationCard(item, item.course?.id ? `/courses/${item.course.id}` : "/dashboard", `Added ${item.created_at ?? "-"}`)
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
