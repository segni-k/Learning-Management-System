import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  const classes = ["flex", "flex-wrap", "items-center", "justify-between", "gap-4", className]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={classes}>
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description ? <p className="text-sm text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
    </header>
  );
}
