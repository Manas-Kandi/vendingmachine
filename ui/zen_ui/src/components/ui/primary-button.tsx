import { forwardRef } from "react";
import clsx from "clsx";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-transparent bg-color-primary px-8 py-3 text-base font-medium text-color-surface shadow-[0_12px_32px_rgba(92,127,100,0.25)] transition-transform duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-primary",
        "hover:scale-105 hover:shadow-[0_16px_36px_rgba(92,127,100,0.32)]",
        "disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </button>
  ),
);

PrimaryButton.displayName = "PrimaryButton";
