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

          <section
            id="tour"
            className="layout-shell mt-16 grid gap-10 text-sm text-color-text-secondary lg:grid-cols-3"
          >
            <article className="space-y-3">
              <h2 className="text-base font-semibold uppercase tracking-[0.24em] text-color-text-primary">
                What it does
              </h2>
              <p>
                Zen Machine ingests vending telemetry, supplier availability, and
                environment signals, then explains what to change—prices, orders,
                or nothing—in one paragraph.
              </p>
            </article>
            <article className="space-y-3">
              <h2 className="text-base font-semibold uppercase tracking-[0.24em] text-color-text-primary">
                How it works
              </h2>
              <ul className="space-y-2">
                <li>1. Polls live data + adversary signals every 15 seconds.</li>
                <li>2. Calls the NVIDIA-backed LLM for reasoning and supplier quotes.</li>
                <li>3. Surfaces clear actions with downloadable traces.</li>
              </ul>
            </article>
            <article className="space-y-3">
              <h2 className="text-base font-semibold uppercase tracking-[0.24em] text-color-text-primary">
                Where to go next
              </h2>
              <p>
                Use the drawer for the live demo, book a walkthrough for production
                rollout, or export the CSV to plug Zen into your BI stack.
              </p>
            </article>
          </section>

          <section className="layout-shell mt-14 w-full space-y-6 text-sm text-color-text-secondary">
            {(telemetry.offline || telemetry.error) && (
              <div className="grid gap-3">
                {telemetry.offline && (
                  <StatusBanner message="You're offline; data will refresh when connection returns." />
                )}
                {telemetry.error && (
                  <StatusBanner
                    tone="error"
                    message="Telemetry link lost. Try again shortly."
                  />
                )}
              </div>
            )}

            {telemetry.metrics.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {telemetry.metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="rounded-2xl border border-color-outline/45 bg-color-surface px-5 py-4"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-color-text-secondary">
                      {metric.label}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-color-text-primary">
                        {metric.value.toFixed(2)}
                      </span>
                      <span className="text-xs text-color-text-secondary">
                        {metric.unit}
                      </span>
                      <span
                        className={
                          metric.delta >= 0 ? "text-color-primary" : "text-color-error"
                        }
                      >
                        {metric.delta >= 0 ? "+" : ""}
                        {metric.delta.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-color-outline/45 bg-color-surface p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-color-text-primary">
                    Inventory snapshot
                  </h3>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-color-text-secondary">
                  Current stock · MSRP reference
                </p>
                <ul className="mt-4 space-y-3">
                  {(telemetry.inventory.length ? telemetry.inventory : []).map((item) => (
                    <li key={item.sku} className="flex items-center justify-between">
                      <span className="font-medium text-color-text-primary">
                        {item.sku.toUpperCase()}
                      </span>
                      <span className="text-sm">
                        {item.stock} units · ${item.msrp.toFixed(2)}
                      </span>
                    </li>
                  ))}
                  {!telemetry.inventory.length && (
                    <li className="text-sm text-color-text-secondary">
                      Inventory will appear once the telemetry service responds.
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-color-outline/45 bg-color-surface p-5 shadow-soft">
                <h3 className="text-base font-semibold text-color-text-primary">
                  Supplier quotes
                </h3>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-color-text-secondary">
                  Latest LLM-backed response
                </p>
                <ul className="mt-4 space-y-3">
                  {(telemetry.orders.length ? telemetry.orders : []).map((order) => (
                    <li key={order.sku} className="border-b border-color-outline/25 pb-3 last:border-none">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-color-text-primary">
                          {order.sku.toUpperCase()}
                        </span>
                        <span className="text-sm text-color-text-secondary">
                          {order.qty} units
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-color-text-secondary">
                        {order.quotePrice
                          ? `Quote $${order.quotePrice.toFixed(2)}, ETA ${order.deliveryDays}d`
                          : "Awaiting supplier quote"}
                        {order.confidence
                          ? ` · Confidence ${(order.confidence * 100).toFixed(1)}%`
                          : ""}
                      </div>
                    </li>
                  ))}
                  {!telemetry.orders.length && (
                    <li className="text-sm text-color-text-secondary">
                      No new orders this cycle. Zen will propose one when stock drops.
                    </li>
                  )}
                </ul>
                {telemetry.status && (
                  <p className="mt-4 text-xs text-color-text-secondary">
                    Revenue ${telemetry.status.revenue.toFixed(2)} · Costs $
                    {telemetry.status.costs.toFixed(2)} · Latency{" "}
                    {telemetry.status.latencyMs.toFixed(1)}ms
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="layout-shell mb-12 mt-6 flex w-full justify-end">
          <ThemeSwitch location="footer" />
        </div>

        <TelemetryStrip />
        <OpenMindDrawer open={drawerOpen} onClose={handleCloseDrawer} />
      </main>
    </TelemetryProvider>
  );
}
