import { useId } from "react";
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

  if (loading) {
    return (
      <div className="h-[78px] w-full animate-pulse rounded-2xl bg-color-surface/60" />
    );
  }

  const path = buildLinePath(values, width, height);

  return (
    <figure
      className="group relative w-full rounded-3xl border border-color-outline/40 bg-color-surface/60 p-4"
      role="img"
      aria-label={title}
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
        </defs>
        {path ? (
          <>
            <path
              d={path}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
            <path
              d={`${path} L ${width} ${height} L 0 ${height} Z`}
              className="fill-color-primary/15"
            />
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
      <figcaption className="mt-2 text-xs uppercase tracking-[0.2em] text-color-text-secondary">
        Last 24 hours
      </figcaption>
    </figure>
  );
};
