import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import clsx from "clsx";

type StatusBannerProps = {
  message: string;
  tone?: "info" | "error";
};

export const StatusBanner = ({ message, tone = "info" }: StatusBannerProps) => (
  <div
    role="status"
    className={clsx(
      "flex min-h-[52px] items-center gap-3 rounded-3xl border px-4 py-3 text-sm shadow-soft backdrop-blur",
      tone === "info"
        ? "border-color-outline/55 bg-color-surface/75 text-color-text-secondary"
        : "border-color-error/60 bg-color-error/10 text-color-error",
    )}
  >
    {tone === "info" ? (
      <CheckCircle size={20} className="text-color-primary" />
    ) : (
      <WarningCircle size={20} className="text-color-error" />
    )}
    <span className="leading-relaxed">{message}</span>
  </div>
);
