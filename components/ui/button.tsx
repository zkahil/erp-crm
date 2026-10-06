import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-brand text-white hover:opacity-90",
  soft: "bg-brand-soft text-brand hover:opacity-80",
  outline: "border border-line bg-surface hover:bg-sunken",
  ghost: "hover:bg-sunken",
} as const;

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={clsx(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-opacity disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
