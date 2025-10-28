import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  CloudRain,
  TrafficSign,
  Thermometer,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import clsx from "clsx";
import {
  telemetryStore,
  TelemetryMetric,
} from "@/lib/state/telemetry-store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useStore } from "@/lib/state/store";

const iconMap: Record<TelemetryMetric["id"], typeof TrendUp> = {
  margin: TrendUp,
  temperature: Thermometer,
  rain: CloudRain,
  traffic: TrafficSign,
};

const formatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export const TelemetryStrip = memo(() => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const metrics = useStore(telemetryStore).metrics;
  const isVisible = useIntersectionObserver(containerRef, {
    threshold: 0.18,
  });

  return (
    <section
      role="region"
      aria-roledescription="Live telemetry strip"
      aria-live="polite"
      aria-label="Live telemetry"
      ref={containerRef}
      className="safe-area-b fixed left-1/2 z-40 w-[min(92vw,760px)] -translate-x-1/2 rounded-full border border-color-outline/50 bg-color-surface/95 px-5 py-4 backdrop-blur-lg shadow-soft transition-all duration-200 md:px-6 lg:w-[min(78vw,1000px)] lg:rounded-[42px]"
      style={{ bottom: "max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))" }}
    >
      <div className="flex items-center justify-between gap-3 lg:h-full">
        {metrics.map((metric) => (
          <MetricPill
            key={metric.id}
            metric={metric}
            animate={isVisible}
          />
        ))}
      </div>
    </section>
  );
});

TelemetryStrip.displayName = "TelemetryStrip";

type MetricPillProps = {
  metric: TelemetryMetric;
  animate: boolean;
};

const MetricPill = ({ metric, animate }: MetricPillProps) => {
  const Icon = iconMap[metric.id];
  const [displayValue, setDisplayValue] = useState(metric.value);
  const previousValue = useRef(metric.value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (!animate) {
      animationRef.current = requestAnimationFrame(() => {
        setDisplayValue(metric.value);
        previousValue.current = metric.value;
        animationRef.current = null;
      });
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    }

    const startValue = previousValue.current;
    const endValue = metric.value;
    const delta = endValue - startValue;
    const duration = 600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      setDisplayValue(startValue + delta * eased);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        previousValue.current = endValue;
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [metric.value, animate]);

  const formattedValue = useMemo(
    () => formatter.format(displayValue),
    [displayValue],
  );
  const deltaClass = metric.delta >= 0 ? "text-color-primary" : "text-color-error";
  const sign = metric.delta > 0 ? "+" : "";

  return (
    <div className="flex min-h-[52px] flex-1 items-center justify-center gap-3 rounded-full bg-color-surface/75 px-3 py-2 text-sm text-color-text-secondary shadow-[0_10px_24px_rgba(33,33,33,0.08)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-color-primary/12 text-color-primary-strong">
        <Icon size={22} weight="regular" />
      </span>
      <div className="flex flex-col">
        <span className="text-[0.7rem] uppercase tracking-[0.34em] text-color-text-secondary">
          {metric.label}
        </span>
        <span className="text-lg font-semibold text-color-text-primary">
          {formattedValue}
          <span className="ml-1 text-sm text-color-text-secondary">
            {metric.unit}
          </span>
        </span>
      </div>
      <span
        className={clsx(
          "ml-auto text-sm font-medium",
          deltaClass,
        )}
        aria-hidden="true"
      >
        {sign}
        {formatter.format(metric.delta)}
      </span>
    </div>
  );
};
