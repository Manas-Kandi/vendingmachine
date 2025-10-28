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
      <main
        className="hero-bg relative flex min-h-screen flex-col items-center overflow-x-hidden bg-color-background pt-24 text-color-text-primary sm:pt-28 lg:pt-36"
        style={{ paddingTop: "calc(6.5rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex w-full flex-col items-center pb-32 sm:pb-36">
          <Hero
            onOpenDrawer={handleOpenDrawer}
            reducedMotion={reducedMotion}
            scrollHintHidden={scrollHintHidden}
            onExitOnboarding={dismiss}
            onboardingActive={!dismissed}
          />

          <section className="layout-shell mt-16 grid gap-8 text-sm text-color-text-secondary lg:grid-cols-[minmax(420px,1.1fr)_minmax(280px,0.8fr)] lg:gap-12">
            <article className="calm-mission-card rounded-[32px] border border-color-outline/45 bg-color-surface/85 p-8 leading-relaxed shadow-soft sm:p-10">
              <h2 className="text-lg font-medium text-color-text-primary">
                Calm mission
              </h2>
              <p className="mt-4 text-[1.06rem] leading-[1.7]">
                Give every visitor a 30-second hit of digital tranquility while
                hiding doctoral-level economics under a single tap. Hover or
                focus any element to surface the full factory.
              </p>
            </article>
            <div className="flex flex-col gap-4">
              {telemetry.offline && (
                <StatusBanner message="You're offline; data will refresh when connection returns." />
              )}
              {telemetry.error && (
                <StatusBanner
                  tone="error"
                  message="Telemetry link lost. Try again shortly."
                />
              )}
              <ThemeSwitch location="footer" />
            </div>
          </section>
        </div>

        <TelemetryStrip />
        <OpenMindDrawer open={drawerOpen} onClose={handleCloseDrawer} />
      </main>
    </TelemetryProvider>
  );
}
