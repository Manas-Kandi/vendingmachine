import { forwardRef } from "react";
import clsx from "clsx";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-color-primary px-9 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-color-surface transition-all duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-color-primary-strong",
        "hover:bg-color-primary-strong hover:shadow-[0_10px_24px_rgba(62,91,70,0.25)] active:scale-[0.99]",
        "disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

PrimaryButton.displayName = "PrimaryButton";
