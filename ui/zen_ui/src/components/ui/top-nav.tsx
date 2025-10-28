import { useCallback } from "react";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

type TopNavProps = {
  onOpenDrawer: () => void;
};

export const TopNav = ({ onOpenDrawer }: TopNavProps) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpenDrawer();
      }
    },
    [onOpenDrawer],
  );

  return (
    <nav
      className="fixed inset-x-0 top-0 z-30 border-b border-color-outline/40 bg-color-background/75 backdrop-blur-lg"
      aria-label="Zen Machine global"
    >
      <div className="layout-shell flex h-16 items-center justify-between gap-4 sm:h-20">
        <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.32em] text-color-text-secondary">
          <Sparkle size={20} weight="duotone" />
          Zen Machine
        </div>
        <a
          role="button"
          tabIndex={0}
          onClick={onOpenDrawer}
          onKeyDown={handleKeyDown}
          className="hidden min-h-[48px] min-w-[48px] items-center justify-center rounded-full border border-color-outline/60 bg-color-surface/80 px-6 text-xs font-semibold uppercase tracking-[0.32em] text-color-primary transition-colors hover:border-color-primary hover:text-color-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-color-primary-strong sm:inline-flex"
        >
          Open Mind
        </a>
      </div>
    </nav>
  );
};
