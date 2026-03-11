import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  const classes = [
    "ui-badge",
    "rounded-full",
    "px-3",
    "py-1",
    "text-[11px]",
    "uppercase",
    "tracking-[0.2em]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
