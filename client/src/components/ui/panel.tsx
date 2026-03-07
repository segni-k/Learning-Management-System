import type { ReactNode } from "react";

type PanelProps = {
  className?: string;
  children: ReactNode;
};

export function Panel({ className, children }: PanelProps) {
  const classes = ["glass-panel", "rounded-2xl", "p-6", className].filter(Boolean).join(" ");
  return <section className={classes}>{children}</section>;
}
