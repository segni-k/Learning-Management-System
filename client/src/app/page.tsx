"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listCourses } from "@/lib/courses";
import type { Course } from "@/lib/types";

type SpotlightCourse = {
  id: number | string;
  title: string;
  description: string;
  level: string;
  instructor: string;
  href: string;
  badge: string;
};

export default function Home() {
  const { user, loading } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        const response = await listCourses();
        if (isMounted) {
          setFeaturedCourses(response.data ?? []);
        }
      } catch {
        if (isMounted) {
          setFeaturedCourses([]);
        }
      }
    };

    void loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const heroSlides = useMemo(
    () => [
      {
        eyebrow: "Now trending in digital learning",
        title: "A professional learning homepage with motion, discovery, and clear outcomes.",
        copy:
          "Create a first impression that feels closer to Coursera with rotating spotlights, learner trust signals, and featured course storytelling.",
        metrics: ["84% completion", "24/7 learner access", "Live progress insights"],
        gradient: "from-amber-400/30 via-orange-500/20 to-slate-950/20",
      },
      {
        eyebrow: "Built for daily learning momentum",
        title: "Show learners what to do next with guided paths, upcoming work, and resume-ready study flows.",
        copy:
          "Atlas LMS keeps the student experience focused by connecting lessons, assessments, notifications, and analytics in one place.",
        metrics: ["Unified dashboard", "Assignments + quizzes", "Progress synced"],
        gradient: "from-sky-400/25 via-cyan-500/20 to-slate-950/20",
      },
      {
        eyebrow: "Professional LMS experience",
        title: "Turn your landing page into a product showcase with banners, FAQs, social proof, and trending courses.",
        copy:
          "Help students understand the value instantly through strong messaging, curated highlights, and a polished browsing experience.",
        metrics: ["Role-based portals", "Modern UI", "Discoverable catalog"],
        gradient: "from-violet-400/25 via-fuchsia-500/15 to-slate-950/20",
      },
    ],
    []
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 4800);

    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  const studentBenefits = [
    {
      title: "Clear learning path",
      copy: "Follow modules and lessons in order, so you always know what to learn next.",
      icon: GraduationCap,
    },
    {
      title: "One dashboard for everything",
      copy: "Track upcoming assignments, quizzes, notifications, and recent activity in one place.",
      icon: LayoutDashboard,
    },
    {
      title: "Resume where you stopped",
      copy: "Jump back to your latest lesson with saved progress and continue without searching.",
      icon: CirclePlay,
    },
    {
      title: "Transparent performance",
      copy: "Review scores, attempts, and completion progress to improve steadily every week.",
      icon: TrendingUp,
    },
  ];

  const learningFlow = [
    {
      step: "01",
      title: "Enroll and start fast",
      copy: "Students join a course and instantly see lessons, deadlines, and progress targets.",
    },
    {
      step: "02",
      title: "Learn and practice",
      copy: "Lessons, resources, assignments, and quizzes are structured for steady weekly momentum.",
    },
    {
      step: "03",
      title: "Track and improve",
      copy: "Dashboard insights, scores, and completion data help students improve every cycle.",
    },
  ];

  const highlights = [
    { label: "Active learners", value: "1,200+" },
    { label: "Courses delivered", value: "85" },
    { label: "Average completion", value: "84%" },
    { label: "Weekly submissions", value: "2,400+" },
  ];

  const trustSignals = [
    "Live course analytics",
    "Assessment-ready workflows",
    "Student-first dashboard design",
    "Modern catalog discovery",
  ];

  const spotlightCourses = useMemo<SpotlightCourse[]>(() => {
    const publishedCourses = featuredCourses.filter((course) => course.status === "published");

    if (publishedCourses.length) {
      return publishedCourses.slice(0, 4).map((course, index) => ({
        id: course.id,
        title: course.title,
        description:
          course.description?.trim() ||
          "Structured lessons, assignments, and progress tracking designed for consistent learner momentum.",
        level: course.level?.trim() || "All levels",
        instructor: course.instructor?.name?.trim() || "Atlas faculty",
        href: `/courses/${course.id}`,
        badge: index === 0 ? "Most popular" : index === 1 ? "High demand" : "Trending now",
      }));
    }

    return [
      {
        id: "design-foundations",
        title: "Design Foundations",
        description: "Visual thinking, creative systems, and guided feedback inside a polished cohort experience.",
        level: "Beginner",
        instructor: "Atlas faculty",
        href: "/courses",
        badge: "Most popular",
      },
      {
        id: "web-productivity",
        title: "Web Productivity Essentials",
        description: "Modern workflows for planning, building, and shipping digital projects with confidence.",
        level: "Intermediate",
        instructor: "Learning studio",
        href: "/courses",
        badge: "High demand",
      },
      {
        id: "data-storytelling",
        title: "Data Storytelling",
        description: "Turn metrics into decision-ready stories using structured lessons and frequent practice.",
        level: "All levels",
        instructor: "Atlas insights team",
        href: "/courses",
        badge: "Trending now",
      },
      {
        id: "career-launch",
        title: "Career Launch Toolkit",
        description: "Portfolio building, communication practice, and milestone-based progress for job-ready learners.",
        level: "Career track",
        instructor: "Mentor network",
        href: "/courses",
        badge: "Learner favorite",
      },
    ];
  }, [featuredCourses]);

  const faqItems = [
    {
      question: "What can students do inside Atlas LMS?",
      answer:
        "Students can access lessons, submit assignments, take quizzes, review progress, check notifications, and resume learning from exactly where they left off.",
    },
    {
      question: "Does the dashboard connect to real course activity?",
      answer:
        "Yes. The dashboard is designed to surface enrolled courses, lesson completion, recent activity, assessments, and notifications from backend LMS endpoints.",
    },
    {
      question: "Can instructors and admins use the same platform?",
      answer:
        "Yes. Atlas LMS supports a unified workspace where students, instructors, and administrators each get role-based views connected to the same learning system.",
    },
    {
      question: "Why add rotating banners and FAQs to the landing page?",
      answer:
        "They make the homepage feel more complete and professional by highlighting value, building trust, and helping new learners understand the platform quickly.",
    },
  ];

  const activeSlide = heroSlides[activeHeroSlide];

  return (
    <div className="min-h-screen text-slate-100">
      <main className="landing-page mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 py-20 md:gap-24 md:py-24">
        <header className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">
              Learning management system
            </p>
            <h1 className="max-w-4xl font-display text-4xl leading-[1.06] sm:text-5xl md:text-6xl lg:text-[4rem]">
              Build better learning outcomes with one focused LMS workspace.
            </h1>
            <p className="max-w-3xl text-lg text-slate-300 md:text-xl">
              Atlas LMS brings instructors, students, and administrators into a unified space for
              lessons, assessments, progress, and analytics backed by a Laravel API.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                href={user ? "/dashboard" : "/login"}
              >
                {loading ? "Checking session..." : user ? "Go to dashboard" : "Sign in"}
              </Link>
              <Link
                className="rounded-full border border-slate-700/80 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                href="/register"
              >
                Create account
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {trustSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full border border-slate-800/80 bg-slate-950/55 px-4 py-2 text-xs text-slate-300"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-panel relative overflow-hidden rounded-[2rem] p-7 md:p-8">
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${activeSlide.gradient}`}
            />
            <div className="relative space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-amber-200/80">
                  Swiping spotlight
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous banner"
                    onClick={() => setActiveHeroSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
                    className="rounded-full border border-slate-700/70 bg-slate-950/70 p-2 text-slate-200 transition hover:border-slate-500"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next banner"
                    onClick={() => setActiveHeroSlide((current) => (current + 1) % heroSlides.length)}
                    className="rounded-full border border-slate-700/70 bg-slate-950/70 p-2 text-slate-200 transition hover:border-slate-500"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{activeSlide.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight md:text-3xl">
                  {activeSlide.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
                  {activeSlide.copy}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {activeSlide.metrics.map((metric) => (
                    <div key={metric} className="rounded-2xl border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
                      {metric}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={user ? "/dashboard" : "/login"}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950"
                  >
                    {user ? "Open learning hub" : "Explore the platform"}
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 px-5 py-2.5 text-sm font-semibold text-slate-200"
                  >
                    Browse catalog
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      aria-label={`Go to banner ${index + 1}`}
                      onClick={() => setActiveHeroSlide(index)}
                      className={`h-2.5 rounded-full transition ${index === activeHeroSlide ? "w-8 bg-amber-400" : "w-2.5 bg-slate-700"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400">Auto-swiping every 4.8 seconds</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.label} className="glass-panel rounded-2xl p-5">
              <p className="text-3xl font-semibold text-slate-50">{item.value}</p>
              <p className="mt-2 text-sm text-slate-400">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel rounded-3xl p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student experience</p>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">What students get from this LMS</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Every learning action feels connected. Students can discover courses, follow a guided
              path, complete assignments, stay on top of quizzes, and track progress inside one
              consistent experience.
            </p>
            <div className="mt-6 grid gap-4">
              {studentBenefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div key={benefit.title} className="rounded-2xl border border-slate-800/80 bg-slate-950/65 p-5">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-300">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{benefit.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{benefit.copy}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="glass-panel rounded-3xl p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Professional value</p>
              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Designed to look and feel production-ready</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Professional homepage",
                    copy: "Rotating banners, curated discovery, and trust-building content blocks.",
                    icon: Sparkles,
                  },
                  {
                    title: "Course discovery",
                    copy: "Trending courses, role-based navigation, and direct browsing paths.",
                    icon: BookOpen,
                  },
                  {
                    title: "Secure workflows",
                    copy: "Authentication, roles, and structured experiences for each type of user.",
                    icon: ShieldCheck,
                  },
                  {
                    title: "Performance visibility",
                    copy: "Students can quickly understand where they stand and what to do next.",
                    icon: Star,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="rounded-2xl border border-slate-800/80 bg-slate-950/65 p-5">
                      <div className="flex items-center gap-3 text-amber-300">
                        <Icon size={18} />
                        <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">{item.copy}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Everything connects</p>
              <h3 className="mt-2 text-2xl font-semibold">Your homepage should lead directly into learning momentum</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Use the landing page to educate new learners, spotlight trending courses, and move
                them naturally into the dashboard where actual lessons, assessments, and progress data live.
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950"
                href={user ? "/dashboard" : "/login"}
              >
                {user ? "Open dashboard" : "Sign in to view dashboard"}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Trending courses</p>
              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Popular learning tracks students can discover fast</h2>
            </div>
            <Link href="/courses" className="inline-flex items-center gap-2 text-sm font-medium text-amber-300">
              View full catalog
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {spotlightCourses.map((course) => (
              <div key={course.id} className="glass-panel rounded-3xl p-5 transition hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
                    {course.badge}
                  </span>
                  <span className="text-xs text-slate-500">{course.level}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-50">{course.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{course.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">By {course.instructor}</p>
                <Link
                  href={course.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-300"
                >
                  Explore course
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="glass-panel rounded-3xl p-7 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Learning flow</p>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">A modern path from enrollment to results</h2>
            <div className="mt-6 space-y-4">
              {learningFlow.map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5"
                >
                  <p className="text-xs font-semibold tracking-[0.2em] text-amber-300">STEP {item.step}</p>
                  <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Why it feels premium</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Cleaner hierarchy",
                  "Guided learner actions",
                  "Discoverable course sections",
                  "Helpful trust-building FAQ",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-lg font-semibold">Built for students, instructors, and admins</h3>
              <p className="mt-2 text-sm text-slate-300">
                Keep communication clear, monitor learning in real time, and reduce friction across
                lessons, submissions, grading, and daily course discovery.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950"
                  href={user ? "/dashboard" : "/login"}
                >
                  {user ? "Go to dashboard" : "Sign in now"}
                </Link>
                <Link
                  className="rounded-full border border-slate-700/80 px-5 py-2 text-sm font-semibold text-slate-200"
                  href="/register"
                >
                  Create your account
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel rounded-3xl p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Frequently asked questions</p>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">FAQ</h2>
            <div className="mt-6 space-y-4">
              {faqItems.map((item) => (
                <details key={item.question} className="group rounded-2xl border border-slate-800/80 bg-slate-950/65 p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-100">
                    <span>{item.question}</span>
                    <span className="text-amber-300 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-slate-400">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Ready to learn</p>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Launch a cleaner, stronger LMS front door</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
              A strong landing page should sell the value of the platform before students ever sign in.
              Atlas LMS now has room for banners, discovery, FAQs, outcomes, and guided action.
            </p>
            <div className="mt-6 rounded-[1.75rem] border border-amber-400/20 bg-amber-400/10 p-5">
              <p className="text-sm font-semibold text-amber-200">What gets improved</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>• More professional course discovery</li>
                <li>• Better storytelling for students</li>
                <li>• Clearer path into the dashboard</li>
                <li>• Modern, premium visual rhythm</li>
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950"
              >
                {user ? "Open dashboard" : "Start with sign in"}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 px-5 py-2.5 text-sm font-semibold text-slate-200"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
