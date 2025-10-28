import { useId, useMemo } from "react";
import clsx from "clsx";
import { buildLinePath } from "@/lib/utils/chart";

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  reducedMotion?: boolean;
  title?: string;
  loading?: boolean;
};

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 64;

export const Sparkline = ({
  values,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  reducedMotion = false,
  title = "Margin over last 24 hours",
  loading = false,
}: SparklineProps) => {
  const gradientId = useId();
  const backgroundId = useId();
  const captionId = useId();

  const stats = useMemo(() => {
    if (!values.length) {
      return null;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const first = values[0];
    const last = values[values.length - 1];
    const direction = last > first ? "rising" : last < first ? "softening" : "steady";
    return { min, max, first, last, direction };
  }, [values]);

  if (loading) {
    return (
      <div className="h-[78px] w-full animate-pulse rounded-2xl bg-color-surface/60" />
    );
  }

  const path = buildLinePath(values, width, height);

  return (
    <figure
      className="group relative w-full rounded-3xl border border-color-outline/45 bg-color-surface/70 p-5 shadow-[0_18px_42px_rgba(33,33,33,0.08)]"
      role="img"
      aria-label={title}
      aria-describedby={stats ? captionId : undefined}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={clsx(
          "w-full overflow-visible text-color-primary",
          reducedMotion ? "" : "transition-transform duration-300 ease-out group-hover:scale-[1.01]",
        )}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(92,127,100,0.65)" />
            <stop offset="100%" stopColor="rgba(92,127,100,0.1)" />
          </linearGradient>
          <linearGradient id={backgroundId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(92,127,100,0.05)" />
            <stop offset="100%" stopColor="rgba(92,127,100,0.15)" />
          </linearGradient>
        </defs>
        {path ? (
          <>
            <rect
              x="0"
              y="0"
              width={width}
              height={height}
              fill={`url(#${backgroundId})`}
            />
            <line
              x1="0"
              y1={height - 1}
              x2={width}
              y2={height - 1}
              stroke="rgba(117,117,117,0.25)"
              strokeWidth={1}
            />
            <path
              d={path}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d={`${path} L ${width} ${height} L 0 ${height} Z`}
              className="fill-color-primary/12"
            />
            {stats && (
              <circle
                cx={width}
                cy={height - ((values[values.length - 1] - stats.min) / (stats.max - stats.min || 1)) * height}
                r={4.5}
                fill="var(--color-primary)"
                stroke="var(--color-surface)"
                strokeWidth={1.6}
              />
            )}
          </>
        ) : (
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="text-sm fill-color-text-secondary"
          >
            No data
          </text>
        )}
      </svg>
      <figcaption
        id={captionId}
        className="mt-3 text-xs uppercase tracking-[0.28em] text-color-text-secondary"
      >
        {stats
          ? `Last 24h · Low ${stats.min.toFixed(1)} · High ${stats.max.toFixed(
              1,
            )} · ${stats.direction}`
          : "Awaiting signal"}
      </figcaption>
    </figure>
  );
};
