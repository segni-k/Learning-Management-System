import type { HTMLAttributes, ReactNode } from "react";

type CardProps = {
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: CardProps) {
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

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
