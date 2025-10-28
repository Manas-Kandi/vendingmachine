import { useId } from "react";

type ForkSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export const ForkSlider = ({ value, onChange }: ForkSliderProps) => {
  const sliderId = useId();

  return (
    <div className="rounded-3xl border border-color-outline/40 bg-color-surface/60 px-4 py-5">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-color-text-primary">
          Fork the day
        </h3>
        <span className="text-xs uppercase tracking-[0.3em] text-color-text-secondary">
          Replay
        </span>
      </header>
      <label
        htmlFor={sliderId}
        className="mb-3 block text-sm text-color-text-secondary"
      >
        Compare outcomes with / without adversary influence.
      </label>
      <div className="relative flex items-center gap-4">
        <span className="w-16 text-xs font-medium uppercase tracking-[0.3em] text-color-text-secondary">
          Calm
        </span>
        <div className="relative h-2 flex-1 rounded-full bg-color-background/70">
          <div
            className="absolute inset-y-0 rounded-full bg-color-primary/25"
            style={{ width: `${value}%` }}
          />
          <input
            id={sliderId}
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="absolute inset-0 h-2 w-full appearance-none bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-primary [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-color-primary-strong [&::-webkit-slider-thumb]:bg-[var(--color-surface)] [&::-webkit-slider-thumb]:shadow-soft [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-color-primary-strong [&::-moz-range-thumb]:bg-[var(--color-surface)]"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            aria-label="Replay the day with or without adversary influence"
          />
        </div>
        <span className="w-16 text-right text-xs font-medium uppercase tracking-[0.3em] text-color-text-secondary">
          Adversary
        </span>
      </div>
    </div>
  );
};
