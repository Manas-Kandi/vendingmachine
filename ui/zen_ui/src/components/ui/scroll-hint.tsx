import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import clsx from "clsx";

type ScrollHintProps = {
  hidden: boolean;
};

export const ScrollHint = ({ hidden }: ScrollHintProps) => (
  <div
    className={clsx(
      "pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-xs uppercase tracking-[0.3em] text-color-text-secondary transition-opacity duration-300 ease-out",
      hidden ? "opacity-0" : "opacity-80",
    )}
    aria-hidden="true"
  >
    <span>Scroll</span>
    <CaretDown size={20} className="animate-bounce text-color-text-secondary" />
  </div>
);
