import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const sizeClasses: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-3.5 py-2 text-sm",
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white hover:opacity-90",
  secondary: "border border-muted/40 text-text hover:bg-black/5 dark:text-white dark:hover:bg-white/10",
  destructive: "bg-danger text-white hover:opacity-90",
  ghost: "text-text hover:bg-black/5 dark:text-white dark:hover:bg-white/10",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "secondary", size = "md", type = "button", ...props },
  ref,
) {
  const computed = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button ref={ref} type={type} className={computed} {...props} />;
});

export default Button;
