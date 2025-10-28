import { useSyncExternalStore } from "react";

const STORAGE_KEY = "zen-machine-onboarding-dismissed";
const LOCAL_EVENT = "zen-machine:onboarding-toggle";

const readStoredPreference = () => {
  if (typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(STORAGE_KEY) === "true";
};

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(LOCAL_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(LOCAL_EVENT, handler);
  };
};

export const useOnboarding = () => {
  const dismissed = useSyncExternalStore(
    subscribe,
    readStoredPreference,
    () => true,
  );

  const dismiss = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new Event(LOCAL_EVENT));
  };

  return {
    dismissed,
    dismiss,
  };
};
