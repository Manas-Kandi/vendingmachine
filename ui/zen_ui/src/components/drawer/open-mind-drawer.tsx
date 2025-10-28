import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  DownloadSimple,
  Pulse,
  X,
} from "@phosphor-icons/react/dist/ssr";
import clsx from "clsx";
import { Sparkline } from "@/components/charts/sparkline";
import { TraceTimeline } from "@/components/charts/trace-timeline";
import { ForkSlider } from "./fork-slider";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import {
  telemetryStore,
  TelemetryPoint,
} from "@/lib/state/telemetry-store";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useStore } from "@/lib/state/store";

type OpenMindDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const focusableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "summary",
  "[contenteditable]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const buildCsv = (timeline: TelemetryPoint[]) => {
  const header = "timestamp,margin,adversary_pulse";
  const rows = timeline.map((point) =>
    [point.timestamp, point.margin, point.adversaryPulse].join(","),
  );
  return [header, ...rows].join("\n");
};

export const OpenMindDrawer = ({ open, onClose }: OpenMindDrawerProps) => {
  const telemetry = useStore(telemetryStore);
  const reducedMotion = usePrefersReducedMotion();
  const [forkValue, setForkValue] = useState(48);
  const drawerId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElement.current = document.activeElement as HTMLElement;
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const focusable = dialog.querySelectorAll<HTMLElement>(focusableSelector);
    const firstFocusable = focusable[0];
    firstFocusable?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const focusables = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusables.length) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open && previousActiveElement.current) {
      previousActiveElement.current.focus({ preventScroll: true });
      previousActiveElement.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const touchStart = { x: 0, y: 0 };
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStart.x = touch.clientX;
      touchStart.y = touch.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = Math.abs(touch.clientY - touchStart.y);
      if (deltaX > 80 && deltaY < 60) {
        onClose();
      }
    };

    dialog.addEventListener("touchstart", handleTouchStart, { passive: true });
    dialog.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      dialog.removeEventListener("touchstart", handleTouchStart);
      dialog.removeEventListener("touchmove", handleTouchMove);
    };
  }, [open, onClose]);

  const csvContent = useMemo(
    () => buildCsv(telemetry.timeline),
    [telemetry.timeline],
  );

  return (
    <div
      aria-hidden={!open}
      className={clsx(
        "pointer-events-none fixed inset-0 z-50 flex bg-black/10 backdrop-blur-sm transition-colors duration-200 lg:justify-end",
        open && "pointer-events-auto bg-black/20",
      )}
    >
      <div
        className={clsx(
          "absolute inset-0 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${drawerId}-title`}
        className={clsx(
          "relative ml-auto flex h-[92vh] w-full max-w-full flex-col gap-6 rounded-t-[36px] border border-color-outline/45 bg-color-surface px-6 pb-8 pt-8 shadow-[0_32px_80px_rgba(17,17,17,0.28)] transition-transform duration-280 ease-[cubic-bezier(0.32,0,0.2,1)] will-change-transform sm:h-[86vh] sm:px-8 sm:pt-10 lg:h-full lg:max-w-[var(--drawer-width)] lg:rounded-none lg:border-l lg:px-10 lg:pb-10 lg:pt-14",
          open
            ? "translate-y-0 lg:translate-x-0"
            : "translate-y-full lg:translate-x-full",
        )}
      >
        <header className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-color-text-secondary">
              <Pulse size={16} />
              Thought
            </p>
            <h2
              id={`${drawerId}-title`}
              className="mt-2 text-xl font-medium text-color-text-primary"
            >
              Open Mind
            </h2>
          </div>
          <button
            className="rounded-full border border-color-outline/40 bg-color-background/80 p-3 text-color-text-secondary transition-colors hover:border-color-primary hover:text-color-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-primary-strong"
            onClick={onClose}
          >
            <span className="sr-only">Close drawer</span>
            <X size={18} />
          </button>
        </header>

        <section className="rounded-3xl border border-color-outline/40 bg-color-background/65 p-5 text-sm leading-relaxed text-color-text-secondary">
          {telemetry.loading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-color-surface/60" />
          ) : (
            <p>
              {telemetry.reasoning}
            </p>
          )}
          {telemetry.lastUpdated && (
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-color-text-secondary">
              Updated {new Date(telemetry.lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </section>

        <Sparkline
          values={telemetry.marginSeries}
          reducedMotion={reducedMotion}
          loading={telemetry.loading}
        />

        <div className="flex items-center justify-between text-xs text-color-text-secondary">
          <span className="uppercase tracking-[0.3em]">Data access</span>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`}
            download="zen-machine-timeline.csv"
            className="inline-flex items-center gap-2 rounded-full border border-color-outline/50 bg-color-surface/80 px-3 py-1 text-color-text-secondary transition-colors hover:border-color-primary hover:text-color-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-primary-strong"
          >
            <DownloadSimple size={16} />
            CSV
          </a>
        </div>

        <TraceTimeline
          timeline={telemetry.timeline}
          onBrushChange={() => undefined}
        />

        <ForkSlider value={forkValue} onChange={setForkValue} />

        <ThemeSwitch location="drawer" />

        <footer className="mt-auto grid gap-3 text-xs text-color-text-secondary">
          {telemetry.offline && (
            <div className="rounded-2xl border border-dashed border-color-outline/60 bg-color-background/70 p-3 text-sm text-color-text-secondary">
              You&apos;re offline; data will refresh when connection returns.
            </div>
          )}
          {telemetry.error && (
            <div className="rounded-2xl border border-color-error/40 bg-color-error/10 p-3 text-sm text-color-error">
              {telemetry.error}
            </div>
          )}
          <p className="flex items-center gap-2">
            <ArrowRight size={16} />
            Replay slider toggles adversary influence; Esc closes.
          </p>
        </footer>
      </aside>
    </div>
  );
};
