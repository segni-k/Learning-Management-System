type StatProps = {
  label: string;
  value: string | number;
  className?: string;
};

export function Stat({ label, value, className }: StatProps) {
  const classes = ["glass-panel", "rounded-2xl", "p-5", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
