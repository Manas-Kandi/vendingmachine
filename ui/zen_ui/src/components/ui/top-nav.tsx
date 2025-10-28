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
      className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between bg-color-background/70 px-6 backdrop-blur-md sm:px-12 lg:px-20"
      aria-label="Zen Machine global"
    >
      <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.3em] text-color-text-secondary">
        <Sparkle size={18} weight="duotone" />
        Zen Machine
      </div>
      <a
        role="button"
        tabIndex={0}
        onClick={onOpenDrawer}
        onKeyDown={handleKeyDown}
        className="hidden rounded-full border border-color-outline/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-color-text-secondary transition-colors hover:text-color-text-primary sm:inline-flex"
      >
        Open Mind
      </a>
    </nav>
  );
};
