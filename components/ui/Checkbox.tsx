import type { InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, id, className = "", ...props }: CheckboxProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      htmlFor={inputId}
      className={`flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 ${className}`}
    >
      <input
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
