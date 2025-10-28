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
        "flex min-h-[52px] items-center gap-3 rounded-full border border-color-outline/60 bg-color-surface/80 px-5 text-sm text-color-text-secondary shadow-soft transition-all duration-200",
        "hover:border-color-primary hover:text-color-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-color-primary-strong",
        location === "drawer"
          ? "w-full justify-between"
          : "justify-center",
      )}
      aria-label={label}
    >
      <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-color-background/80">
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
