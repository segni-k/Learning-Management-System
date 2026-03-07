import type { ReactNode } from "react";

type CardProps = {
  className?: string;
  children: ReactNode;
};

export function Card({ className, children }: CardProps) {
  const classes = [
    "rounded-xl",
    "border",
    "border-slate-800/80",
    "bg-slate-950/70",
    "p-4",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
