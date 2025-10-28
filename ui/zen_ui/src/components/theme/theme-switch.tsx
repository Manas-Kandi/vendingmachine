import { useMemo } from "react";
import { MoonStars, Sun } from "@phosphor-icons/react/dist/ssr";
import clsx from "clsx";
import { useTheme } from "./theme-context";

type ThemeSwitchProps = {
  location?: "footer" | "drawer";
};

export const ThemeSwitch = ({ location = "footer" }: ThemeSwitchProps) => {
  const { theme, toggleTheme } = useTheme();

  const label = useMemo(
    () =>
      theme === "dark"
        ? "Switch to light mode"
        : "Switch to dark mode",
    [theme],
  );

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        "flex items-center gap-3 rounded-full border border-color-outline/60 bg-color-surface/70 px-4 py-2 text-sm text-color-text-secondary shadow-soft transition-colors duration-200",
        "hover:text-color-text-primary",
        location === "drawer"
          ? "w-full justify-between"
          : "justify-center",
      )}
      aria-label={label}
    >
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-color-background/80">
        <Sun
          size={20}
          weight="duotone"
          className={clsx(
            "absolute transition-transform duration-200 ease-in-out",
            theme === "dark" ? "-translate-y-6 opacity-0" : "translate-y-0 opacity-100",
          )}
        />
        <MoonStars
          size={20}
          weight="duotone"
          className={clsx(
            "absolute transition-transform duration-200 ease-in-out",
            theme === "dark" ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
        />
      </span>
      <span className="uppercase tracking-[0.3em]">
        {theme === "dark" ? "Night" : "Day"}
      </span>
    </button>
  );
};
