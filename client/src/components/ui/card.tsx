import type { HTMLAttributes, ReactNode } from "react";

type CardProps = {
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: CardProps) {
  const classes = [
    "ui-card",
    "rounded-xl",
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
