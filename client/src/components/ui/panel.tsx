import type { HTMLAttributes, ReactNode } from "react";

type PanelProps = {
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>;

export function Panel({ className, children, ...props }: PanelProps) {
  const classes = ["glass-panel", "rounded-2xl", "p-6", className].filter(Boolean).join(" ");
  return (
    <section className={classes} {...props}>
      {children}
    </section>
  );
}
