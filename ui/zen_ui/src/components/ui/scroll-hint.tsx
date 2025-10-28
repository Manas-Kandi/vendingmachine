import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import clsx from "clsx";

type ScrollHintProps = {
  hidden: boolean;
};

export const ScrollHint = ({ hidden }: ScrollHintProps) => (
  <div
    className={clsx(
      "pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-[0.65rem] uppercase tracking-[0.34em] text-color-text-secondary transition-all duration-300 ease-out",
      hidden ? "translate-y-4 opacity-0" : "translate-y-0 opacity-90",
    )}
    aria-hidden="true"
  >
    <span>Scroll</span>
    <CaretDown
      size={20}
      className="scroll-hint__icon text-color-text-secondary"
    />
  </div>
);
