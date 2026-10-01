import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret";

const variants: Record<Variant, string> = {
  primary: "bg-claret text-white hover:bg-claret-deep",
  secondary: "border border-line bg-white text-ink hover:bg-shell",
  ghost: "text-claret hover:text-claret-deep",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-base",
};

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "children">;

export function Button({
  variant = "primary",
  size = "md",
  href,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const classNameCombined = [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");

  if (href) {
    return (
      <a className={classNameCombined} href={href} {...(props as ComponentPropsWithoutRef<"a">)}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classNameCombined} {...props}>
      {children}
    </button>
  );
}