import Link from "next/link";
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
      className="layout-shell relative grid gap-16 pb-24 pt-20 lg:grid-cols-[minmax(320px,1fr)_minmax(240px,0.9fr)] lg:items-center"
      aria-labelledby="hero-heading"
    >
      <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
        <MachineIllustration reducedMotion={reducedMotion} />
      </div>
      <div className="order-1 flex flex-col gap-10 lg:order-2">
        <div className="space-y-6">
          <span className="inline-flex w-fit items-center rounded-full border border-color-outline/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.34em] text-color-primary-strong">
            Zen Machine
          </span>
          <h1
            id="hero-heading"
            className="text-4xl font-light leading-tight text-color-text-primary sm:text-[3.2rem]"
          >
            Supply telemetry you can actually act on.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-color-text-secondary">
            Zen Machine surfaces live margin, demand, and supplier decisions for your
            vending fleet. One dashboard, one tap, zero guesswork.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-color-text-secondary">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-color-primary" />
            <p>
              <strong>Who it&apos;s for:</strong> revenue teams operating multi-location
              vending or micromobility kiosks.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-color-primary" />
            <p>
              <strong>What you get:</strong> plain-language AI decisions, supplier quotes,
              and adversary signal in under 30 seconds.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-color-primary" />
            <p>
              <strong>How it works:</strong> LLM reasoning sits on top of live telemetry
              and optimisation. No spreadsheets, no PDFs.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <PrimaryButton onClick={onOpenDrawer}>Explore Live Demo</PrimaryButton>
          <Link
            href="#tour"
            className="text-sm font-medium uppercase tracking-[0.24em] text-color-primary transition-colors hover:text-color-primary-strong"
          >
            Book a walkthrough
          </Link>
        </div>

        {onboardingActive && (
          <div className="rounded-2xl border border-color-outline/50 bg-color-surface px-4 py-3 text-sm text-color-text-secondary shadow-soft">
            <p className="font-medium text-color-text-primary">Quick tip</p>
            <p className="mt-1">
              Tap “Explore Live Demo” to open the drawer. It narrates what Zen is doing
              in clear, human language.
            </p>
            <button
              onClick={onExitOnboarding}
              className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-color-primary hover:text-color-primary-strong"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      <ScrollHint hidden={scrollHintHidden} />
    </section>
  ),
);

Hero.displayName = "Hero";
