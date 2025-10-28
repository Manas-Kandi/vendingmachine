import { forwardRef } from "react";
import clsx from "clsx";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "group relative inline-flex min-h-[52px] min-w-[52px] items-center justify-center overflow-hidden rounded-full border border-color-primary-strong/40 bg-gradient-to-r from-color-primary-strong via-color-primary to-color-primary px-10 py-3 text-base font-semibold uppercase tracking-[0.32em] text-color-surface shadow-[0_18px_42px_rgba(70,105,80,0.32)] transition-transform duration-130 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-color-accent",
        "hover:scale-[1.03] hover:shadow-[0_20px_48px_rgba(62,91,70,0.38)] active:scale-[0.99]",
        "disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </button>
  ),
);

PrimaryButton.displayName = "PrimaryButton";
