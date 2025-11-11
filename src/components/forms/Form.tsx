import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type FieldRenderProps = {
  describedBy?: string;
  errorId?: string;
};

type FieldProps = {
  label: string;
  htmlFor: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: FieldRenderProps) => ReactNode;
};

const baseInputClasses =
  "w-full rounded-md border border-border dark:border-borderDark bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-foreground dark:text-white placeholder:text-textMuted dark:placeholder:text-textMuted outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 transition disabled:cursor-not-allowed disabled:opacity-60";

const invalidClasses = "border-danger focus-visible:ring-danger/40";

export function Field({ label, htmlFor, description, error, required, className, children }: FieldProps) {
  const descriptionId = description ? `${htmlFor}-description` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {children({ describedBy, errorId })}
      {description ? (
        <p id={descriptionId} className="text-xs text-textMuted">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type BaseInputProps = {
  invalid?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, BaseInputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(baseInputClasses, invalid && invalidClasses, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

type NumberInputProps = Omit<BaseInputProps, "type">;

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { className, invalid, ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      inputMode="decimal"
      autoComplete="off"
      invalid={invalid}
      className={className}
      {...props}
    />
  );
});

type SelectProps = {
  invalid?: boolean;
} & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        baseInputClasses,
        "pr-8",
        invalid && invalidClasses,
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

type TextareaProps = {
  invalid?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(baseInputClasses, "min-h-[120px] resize-y", invalid && invalidClasses, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export function UnitSuffix({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-textMuted">
      {children}
    </span>
  );
}
