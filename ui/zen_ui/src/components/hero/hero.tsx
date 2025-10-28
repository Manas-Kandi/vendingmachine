import { memo } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ScrollHint } from "@/components/ui/scroll-hint";
import { MachineIllustration } from "./machine-illustration";

type HeroProps = {
  onOpenDrawer: () => void;
  reducedMotion: boolean;
  scrollHintHidden: boolean;
  onExitOnboarding: () => void;
  onboardingActive: boolean;
};

export const Hero = memo(
  ({
    onOpenDrawer,
    reducedMotion,
    scrollHintHidden,
    onExitOnboarding,
    onboardingActive,
  }: HeroProps) => (
    <section
      className="relative isolate grid min-h-[80vh] w-full max-w-[min(1320px,92vw)] grid-cols-1 items-center gap-12 pb-24 pt-16 lg:grid-cols-[0.9fr_1.8fr] lg:gap-16"
      aria-labelledby="hero-heading"
    >
      <div className="relative flex flex-col items-center justify-center lg:items-start">
        <MachineIllustration reducedMotion={reducedMotion} />
        {onboardingActive && (
          <div className="absolute -bottom-10 left-1/2 w-[240px] -translate-x-1/2 rounded-2xl border border-color-outline bg-color-surface/95 px-4 py-3 text-sm text-color-text-secondary shadow-soft transition-opacity duration-200 ease-out lg:left-auto lg:right-0 lg:translate-x-0">
            <p className="mb-3 font-medium text-color-text-primary">
              Meet the Open Mind
            </p>
            <p className="mb-4">
              Tap the button to watch the agent narrate its next calm move.
            </p>
            <button
              onClick={onExitOnboarding}
              className="rounded-full border border-transparent bg-color-primary/15 px-4 py-1 text-xs font-medium text-color-primary transition-colors hover:bg-color-primary/25"
            >
              Don&apos;t show tips
            </button>
          </div>
        )}
      </div>

      <div className="relative flex flex-col justify-center gap-10 text-left lg:pl-6">
        <div className="max-w-[540px] space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-color-text-secondary">
            Calm commerce, clear traces.
          </p>
          <h1
            id="hero-heading"
            className="text-5xl font-light leading-tight tracking-tight text-color-text-primary sm:text-6xl"
          >
            Calm commerce, clear traces.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-color-text-secondary">
            Supply rhythms breathe softly while adaptive economics guide every
            mindful choice today.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <PrimaryButton onClick={onOpenDrawer}>Open Mind</PrimaryButton>
          <span className="text-sm text-color-text-secondary">
            Observe 30 seconds of tranquil telemetry.
          </span>
        </div>
      </div>

      <ScrollHint hidden={scrollHintHidden} />
    </section>
  ),
);

Hero.displayName = "Hero";
