import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const base = "rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-60";
const variants: Record<ButtonVariant, string> = {
  primary: "bg-amber-400 text-slate-950",
  outline: "border border-slate-700/80 text-slate-100",
  ghost: "text-amber-300 hover:text-amber-200",
};

export function Button({
  children,
  className,
  variant = "outline",
  ...props
}: ButtonProps) {
  const classes = [base, variants[variant], className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
