import type { ComponentPropsWithoutRef } from "react";

export function Container({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={`mx-auto w-full max-w-6xl px-6 md:px-10 ${className ?? ""}`.trim()}
      {...props}
    />
  );
}