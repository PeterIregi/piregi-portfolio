import type { ComponentPropsWithoutRef } from "react";

export type InputProps = {
  label: string;
  id: string;
  /** Id of the element holding this field's error text, when there is one. */
  describedBy?: string;
  invalid?: boolean;
} & Omit<ComponentPropsWithoutRef<"input">, "id" | "className">;

export function Input({ label, id, describedBy, invalid, type = "text", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className="h-11 w-full rounded border border-edge bg-paper px-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-invalid:border-accent"
        {...props}
      />
    </div>
  );
}
