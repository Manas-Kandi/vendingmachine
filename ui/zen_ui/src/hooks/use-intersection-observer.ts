import { RefObject, useEffect, useState } from "react";

export const useIntersectionObserver = <T extends Element>(
  ref: RefObject<T | null>,
  options?: IntersectionObserverInit,
) => {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      setIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
};
