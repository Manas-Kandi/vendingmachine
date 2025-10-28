import clsx from "clsx";

type StatusBannerProps = {
  message: string;
  tone?: "info" | "error";
};

export const StatusBanner = ({ message, tone = "info" }: StatusBannerProps) => (
  <div
    role="status"
    className={clsx(
      "rounded-3xl border px-4 py-3 text-sm shadow-soft backdrop-blur",
      tone === "info"
        ? "border-color-outline/60 bg-color-surface/70 text-color-text-secondary"
        : "border-color-error/50 bg-color-error/10 text-color-error",
    )}
  >
    {message}
  </div>
);
