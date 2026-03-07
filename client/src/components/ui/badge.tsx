import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  const classes = [
    "rounded-full",
    "border",
    "border-slate-700/80",
    "px-3",
    "py-1",
    "text-[11px]",
    "uppercase",
    "tracking-[0.2em]",
    "text-slate-400",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
