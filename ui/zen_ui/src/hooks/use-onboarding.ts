import { useEffect, useState } from "react";

const STORAGE_KEY = "zen-machine-onboarding-dismissed";

const readStoredPreference = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === "true";
};

export const useOnboarding = () => {
  const [dismissed, setDismissed] = useState<boolean>(readStoredPreference);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setDismissed(event.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  return {
    dismissed,
    dismiss,
  };
};
