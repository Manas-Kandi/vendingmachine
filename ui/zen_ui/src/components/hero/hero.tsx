import Link from "next/link";
import { memo } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
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
      className="relative isolate min-h-[82vh] overflow-hidden pb-32 pt-28 sm:pb-36 sm:pt-32 lg:min-h-[78vh]"
      aria-labelledby="hero-heading"
    >
      <div className="layout-shell relative grid grid-cols-1 items-center gap-16 lg:grid-cols-[minmax(320px,0.95fr)_minmax(420px,1.05fr)] lg:gap-24">
        <div className="relative flex flex-col items-center justify-center lg:items-start">
          <div className="absolute -top-14 -left-16 hidden h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle_at_center,rgba(92,127,100,0.18),transparent_70%)] blur-3xl lg:block" />
          <MachineIllustration reducedMotion={reducedMotion} />
          <div className="pointer-events-none absolute inset-0 -z-[1] rounded-[40px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_70%)] blur-3xl" />

          <div className="absolute -bottom-16 left-1/2 flex w-[min(320px,80vw)] -translate-x-1/2 items-center justify-between rounded-3xl border border-color-outline/45 bg-color-surface/90 px-5 py-4 text-sm text-color-text-secondary shadow-[0_14px_35px_rgba(33,33,33,0.14)] lg:left-6 lg:translate-x-0">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-color-primary-strong">
                Margin pulse
              </p>
              <p className="mt-1 text-lg font-semibold text-color-text-primary">
                18.6% calm yield
              </p>
            </div>
            <div className="flex flex-col items-end text-right text-xs">
              <span className="text-color-text-secondary">Visitors</span>
              <span className="text-sm font-semibold text-color-primary">+23</span>
            </div>
          </div>

          {onboardingActive && (
            <div className="absolute -bottom-36 left-1/2 w-[280px] -translate-x-1/2 rounded-3xl border border-color-outline/55 bg-color-surface/95 p-5 text-sm text-color-text-secondary shadow-soft transition-opacity duration-200 ease-out lg:left-auto lg:right-0 lg:-bottom-20 lg:translate-x-0">
              <p className="mb-3 font-medium text-color-text-primary">
                Meet the Open Mind
              </p>
              <p className="mb-4">
                Tap the button to watch the agent narrate its next calm move.
              </p>
              <button
                onClick={onExitOnboarding}
                className="rounded-full border border-transparent bg-color-primary/18 px-4 py-1 text-xs font-medium text-color-primary transition-colors hover:bg-color-primary/28"
              >
                Don&apos;t show tips
              </button>
            </div>
          )}
        </div>

        <div className="relative flex flex-col justify-center gap-12 text-left lg:pl-4">
          <div className="max-w-[580px] space-y-7">
            <span className="inline-flex items-center gap-3 rounded-full border border-color-outline/40 bg-color-surface/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.34em] text-color-primary-strong shadow-soft">
              Zen Machine
            </span>
            <h1
              id="hero-heading"
              className="text-5xl font-light leading-[1.05] tracking-tight text-color-text-primary sm:text-[3.5rem]"
            >
              Calm commerce, lucid telemetry.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-color-text-secondary md:text-[1.1rem] md:leading-[1.8]">
              A single tap unfolds the whole supply mind—margin pulses, adversary
              feints, and tranquil counterplay rendered in meditative cadence.
              Watch it breathe in real time.
            </p>
            <ul className="grid gap-3 text-sm text-color-text-secondary lg:grid-cols-2">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-color-primary" />
                30-second calm state snapshot
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-color-accent" />
                Adversary pulses mapped with accent glow
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-color-primary" />
                Dark-mode syncs with your circadian rhythm
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-color-accent" />
                CSV traces and drawer replay slider
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <PrimaryButton onClick={onOpenDrawer}>
              <span className="text-sm uppercase tracking-[0.32em]">Open Mind</span>
            </PrimaryButton>
            <Link
              href="#telemetry"
              className="group inline-flex items-center gap-2 text-sm font-medium text-color-primary transition-colors hover:text-color-primary-strong"
            >
              <span className="uppercase tracking-[0.28em]">Play demo</span>
              <ArrowRight
                size={18}
                className="transition-transform duration-150 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
      <ScrollHint hidden={scrollHintHidden} />
    </section>
  ),
);

Hero.displayName = "Hero";
