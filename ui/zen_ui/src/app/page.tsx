'use client';

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Hero } from "@/components/hero/hero";
import { TelemetryStrip } from "@/components/telemetry/telemetry-strip";
import { TelemetryProvider } from "@/components/telemetry/telemetry-provider";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { StatusBanner } from "@/components/ui/status-banner";
import { TopNav } from "@/components/ui/top-nav";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useOnboarding } from "@/hooks/use-onboarding";
import { telemetryStore } from "@/lib/state/telemetry-store";
import { useStore } from "@/lib/state/store";

const OpenMindDrawer = dynamic(
  () =>
    import("@/components/drawer/open-mind-drawer").then(
      (module) => module.OpenMindDrawer,
    ),
  { ssr: false },
);

export default function Page() {
  const reducedMotion = usePrefersReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollHintHidden, setScrollHintHidden] = useState(false);
  const { dismissed, dismiss } = useOnboarding();
  const telemetry = useStore(telemetryStore);
  const onboardingTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!dismissed) {
      onboardingTimer.current = window.setTimeout(() => {
        dismiss();
      }, 8000);
    }
    return () => {
      if (onboardingTimer.current) {
        window.clearTimeout(onboardingTimer.current);
        onboardingTimer.current = null;
      }
    };
  }, [dismissed, dismiss]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollHintHidden(true);
      window.removeEventListener("scroll", handleScroll);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const touchStart = { x: 0, y: 0, time: 0 };
    const handleTouchStart = (event: TouchEvent) => {
      if (window.innerWidth > 768) {
        return;
      }
      const touch = event.touches[0];
      if (touch.clientX > 32) {
        return;
      }
      touchStart.x = touch.clientX;
      touchStart.y = touch.clientY;
      touchStart.time = Date.now();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (window.innerWidth > 768) {
        return;
      }
      if (touchStart.time === 0) {
        return;
      }
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = Math.abs(touch.clientY - touchStart.y);
      const elapsed = Date.now() - touchStart.time;
      if (deltaX > 80 && deltaY < 60 && elapsed < 600) {
        setDrawerOpen(true);
        dismiss();
        touchStart.time = 0;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [dismiss]);

  const handleOpenDrawer = useCallback(() => {
    setDrawerOpen(true);
    dismiss();
  }, [dismiss]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <TelemetryProvider>
      <TopNav onOpenDrawer={handleOpenDrawer} />
      <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-color-background text-color-text-primary">
        <div className="flex w-full flex-col items-center px-6 pb-32 pt-[64px] sm:px-12 lg:px-20">
          <Hero
            onOpenDrawer={handleOpenDrawer}
            reducedMotion={reducedMotion}
            scrollHintHidden={scrollHintHidden}
            onExitOnboarding={dismiss}
            onboardingActive={!dismissed}
          />

          <section className="mt-16 grid w-full max-w-[min(1320px,92vw)] gap-6 text-sm text-color-text-secondary lg:grid-cols-[1.6fr_1fr]">
            <article className="rounded-3xl border border-color-outline/40 bg-color-surface/80 p-6 leading-relaxed shadow-soft">
              <h2 className="text-lg font-medium text-color-text-primary">
                Calm mission
              </h2>
              <p className="mt-3">
                Give every visitor a 30-second hit of digital tranquility while
                hiding doctoral-level economics under a single tap. Hover or
                focus any element to surface the full factory.
              </p>
            </article>
            <div className="space-y-4">
              {telemetry.offline && (
                <StatusBanner message="You're offline; data will refresh when connection returns." />
              )}
              {telemetry.error && (
                <StatusBanner
                  tone="error"
                  message="Telemetry link lost. Try again shortly."
                />
              )}
              <div className="hidden lg:block">
                <ThemeSwitch location="footer" />
              </div>
            </div>
          </section>
        </div>

        <TelemetryStrip />
        <OpenMindDrawer open={drawerOpen} onClose={handleCloseDrawer} />
      </main>
    </TelemetryProvider>
  );
}
