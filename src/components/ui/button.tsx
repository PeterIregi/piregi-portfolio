import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  // `text-paper` rather than `text-white`: paper is the theme's surface token,
  // so it flips with the scheme. In light mode that is white on the deep red
  // accent (9.2:1); in dark mode it is the dark surface colour on the lighter
  // dark-mode accent (6.2:1). A hardcoded white would put white text on a
  // light red in dark mode at 2.9:1.
  primary: "bg-accent text-paper hover:bg-accent-deep",
  secondary: "border border-edge bg-paper text-ink hover:bg-shell",
  ghost: "text-accent hover:text-accent-deep",
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