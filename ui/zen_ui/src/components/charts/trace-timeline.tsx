import { useId, useMemo, useState } from "react";
import clsx from "clsx";
import { TelemetryPoint } from "@/lib/state/telemetry-store";
import { normalizeTimeline } from "@/lib/utils/chart";

type TraceTimelineProps = {
  timeline: TelemetryPoint[];
  onBrushChange?: (range: { startIndex: number; endIndex: number }) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const TraceTimeline = ({ timeline, onBrushChange }: TraceTimelineProps) => {
  const normalized = useMemo(() => normalizeTimeline(timeline), [timeline]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(
    normalized.length > 0 ? normalized.length - 1 : 0,
  );
  const headingId = useId();
  const captionId = useId();

  const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    const clamped = clamp(next, 0, endIndex - 1);
    setStartIndex(clamped);
    onBrushChange?.({ startIndex: clamped, endIndex });
  };

  const handleEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    const clamped = clamp(next, startIndex + 1, normalized.length - 1);
    setEndIndex(clamped);
    onBrushChange?.({ startIndex, endIndex: clamped });
  };

  if (!normalized.length) {
    return (
      <div className="rounded-3xl border border-dashed border-color-outline/40 bg-color-surface/40 px-4 py-6 text-sm text-color-text-secondary">
        Timeline calibrating…
      </div>
    );
  }

  if (normalized.length === 1) {
    return (
      <div className="rounded-3xl border border-color-outline/40 bg-color-surface/60 px-4 py-5">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-color-text-primary">
            Trace timeline
          </h3>
          <span className="text-xs uppercase tracking-[0.3em] text-color-text-secondary">
            Awaiting signals
          </span>
        </header>
        <div className="h-24 rounded-2xl bg-color-background/50" />
      </div>
    );
  }

  const selectionStart = (startIndex / normalized.length) * 100;
  const selectionEnd = (endIndex / normalized.length) * 100;

  return (
    <div
      className="relative rounded-3xl border border-color-outline/45 bg-color-surface/70 px-5 py-6 shadow-[0_18px_42px_rgba(33,33,33,0.08)]"
      role="group"
      aria-labelledby={headingId}
      aria-describedby={captionId}
    >
      <header className="mb-4 flex items-center justify-between">
        <h3
          id={headingId}
          className="text-sm font-medium text-color-text-primary"
        >
          Trace timeline
        </h3>
        <span className="text-xs uppercase tracking-[0.3em] text-color-text-secondary">
          Adversary pulses
        </span>
      </header>
      <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-color-background/70">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={`timeline-divider-${index}`}
              className="border-l border-dashed border-color-outline/25"
            />
          ))}
        </div>
        {normalized.map((point, index) => (
          <span
            key={point.timestamp}
            style={{
              left: `${(index / normalized.length) * 100}%`,
              height: `${clamp(point.intensity, 0.1, 1) * 100}%`,
            }}
            className={clsx(
              "absolute bottom-0 w-[1%]",
              point.adversaryPulse > 0
                ? "bg-color-accent/80"
                : "bg-color-primary/30",
            )}
          />
        ))}
        <div
          className="absolute inset-y-3 rounded-xl border border-color-primary/40 bg-color-primary/18 backdrop-blur-[2px] transition-[left,width]"
          style={{
            left: `${selectionStart}%`,
            width: `${Math.max(3, selectionEnd - selectionStart)}%`,
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-color-text-secondary" id={captionId}>
        <span>{new Date(normalized[startIndex].timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <span>{new Date(normalized[endIndex].timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, normalized.length - 2)}
        value={startIndex}
        onChange={handleStartChange}
        aria-label="Adjust start of timeline selection"
        className="absolute left-5 right-5 top-6 h-10 appearance-none bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-primary [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-color-primary-strong [&::-webkit-slider-thumb]:bg-[var(--color-surface)] [&::-webkit-slider-thumb]:shadow-soft [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-color-primary-strong [&::-moz-range-thumb]:bg-[var(--color-surface)]"
      />

      <input
        type="range"
        min={Math.min(1, normalized.length - 1)}
        max={Math.max(1, normalized.length - 1)}
        value={endIndex}
        onChange={handleEndChange}
        aria-label="Adjust end of timeline selection"
        className="absolute left-5 right-5 top-16 h-10 appearance-none bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-primary [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-color-primary-strong [&::-webkit-slider-thumb]:bg-[var(--color-surface)] [&::-webkit-slider-thumb]:shadow-soft [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-color-primary-strong [&::-moz-range-thumb]:bg-[var(--color-surface)]"
      />
    </div>
  );
};
