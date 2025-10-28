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
      className="layout-shell relative isolate grid min-h-[82vh] grid-cols-1 items-center gap-14 pb-28 pt-24 sm:pb-32 sm:pt-28 lg:min-h-[76vh] lg:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)] lg:gap-20 xl:grid-cols-[minmax(340px,0.92fr)_minmax(480px,1.05fr)_minmax(220px,0.6fr)] xl:gap-24"
      aria-labelledby="hero-heading"
    >
      <div className="relative flex flex-col items-center justify-center lg:items-start">
        <MachineIllustration reducedMotion={reducedMotion} />
        {onboardingActive && (
          <div className="absolute -bottom-12 left-1/2 w-[260px] -translate-x-1/2 rounded-3xl border border-color-outline/60 bg-color-surface/95 px-5 py-4 text-sm text-color-text-secondary shadow-soft transition-opacity duration-200 ease-out lg:left-auto lg:right-0 lg:translate-x-0">
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

      <div className="relative flex flex-col justify-center gap-12 text-left lg:pl-4 xl:col-span-1">
        <div className="max-w-[560px] space-y-7">
          <p className="text-sm uppercase tracking-[0.32em] text-color-primary-strong">
            Meditative vending intelligence
          </p>
          <h1
            id="hero-heading"
            className="text-5xl font-light leading-[1.04] tracking-tight text-color-text-primary sm:text-[3.35rem]"
          >
            Calm commerce, clear traces.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-color-text-secondary md:text-[1.1rem] md:leading-[1.8]">
            Supply rhythms breathe softly while adaptive economics guide every
            mindful choice today. Breathe in the margin, breathe out the noise.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <PrimaryButton onClick={onOpenDrawer}>
            <span className="text-sm uppercase tracking-[0.32em]">Open Mind</span>
          </PrimaryButton>
          <span className="max-w-[220px] text-sm leading-relaxed text-color-text-secondary">
            Observe 30 seconds of tranquil telemetry.
          </span>
        </div>
      </div>

      <div className="pointer-events-none hidden xl:block" aria-hidden="true" />

      <ScrollHint hidden={scrollHintHidden} />
    </section>
  ),
);

Hero.displayName = "Hero";
