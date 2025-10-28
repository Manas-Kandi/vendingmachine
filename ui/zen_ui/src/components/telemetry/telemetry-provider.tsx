import { useEffect } from "react";
import {
  startTelemetry,
  stopTelemetry,
  telemetryStore,
} from "@/lib/state/telemetry-store";

export const TelemetryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    let frame: number | null = null;
    startTelemetry();

    const markOffline = () =>
      telemetryStore.update((state) => ({
        ...state,
        offline: true,
      }));

    const markOnline = () => {
      telemetryStore.update((state) => ({
        ...state,
        offline: false,
      }));
      // Kick a refresh once the network resumes to fill the drawer with data.
      frame = window.requestAnimationFrame(() => {
        startTelemetry();
      });
    };

    window.addEventListener("offline", markOffline);
    window.addEventListener("online", markOnline);

    return () => {
      stopTelemetry();
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("online", markOnline);
    };
  }, []);

  return <>{children}</>;
};
