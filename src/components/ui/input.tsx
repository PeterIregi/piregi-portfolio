import type { ComponentPropsWithoutRef } from "react";

export type InputProps = {
  label: string;
  id: string;
} & Omit<ComponentPropsWithoutRef<"input">, "id" | "className">;

export function Input({ label, id, type = "text", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="h-11 w-full rounded border border-line bg-white px-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret"
        {...props}
      />
    </div>
  );
}