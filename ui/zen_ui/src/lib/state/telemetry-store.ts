import { createStore } from "./store";

export type TelemetryMetric = {
  id: "margin" | "temperature" | "rain" | "traffic";
  label: string;
  value: number;
  unit: string;
  delta: number;
};

export type TelemetryPoint = {
  timestamp: string;
  margin: number;
  adversaryPulse: number;
};

export type TelemetryState = {
  metrics: TelemetryMetric[];
  marginSeries: number[];
  timeline: TelemetryPoint[];
  reasoning: string;
  offline: boolean;
  loading: boolean;
  error?: string;
  lastUpdated?: string;
};

const initialState: TelemetryState = {
  metrics: [
    { id: "margin", label: "Margin", value: 0, unit: "%", delta: 0 },
    { id: "temperature", label: "Temp", value: 0, unit: "°C", delta: 0 },
    { id: "rain", label: "Rain", value: 0, unit: "%", delta: 0 },
    { id: "traffic", label: "Traffic", value: 0, unit: "idx", delta: 0 },
  ],
  marginSeries: [],
  timeline: [],
  reasoning: "Calibrating supply chain equilibrium...",
  offline: false,
  loading: true,
  error: undefined,
  lastUpdated: undefined,
};

export const telemetryStore = createStore(initialState);

type ApiTelemetry = {
  metrics: Array<{
    id: TelemetryMetric["id"];
    value: number;
    delta: number;
  }>;
  marginSeries: number[];
  timeline: TelemetryPoint[];
  reasoning: string;
  generatedAt: string;
};

const API_PATH = "/api/telemetry";

const mergeMetrics = (
  base: TelemetryMetric[],
  incoming: ApiTelemetry["metrics"],
) =>
  base.map((metric) => {
    const incomingMetric = incoming.find((item) => item.id === metric.id);
    return incomingMetric
      ? {
          ...metric,
          value: incomingMetric.value,
          delta: incomingMetric.delta,
        }
      : metric;
  });

const fetchTelemetry = async () => {
  const response = await fetch(API_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Telemetry request failed with ${response.status}`);
  }
  const payload = (await response.json()) as ApiTelemetry;
  return payload;
};

let pollingHandle: ReturnType<typeof setInterval> | null = null;

const loadTelemetry = async () => {
  try {
    const payload = await fetchTelemetry();
    telemetryStore.update((current) => ({
      ...current,
      metrics: mergeMetrics(current.metrics, payload.metrics),
      marginSeries: payload.marginSeries,
      timeline: payload.timeline,
      reasoning: payload.reasoning,
      loading: false,
      error: undefined,
      offline: false,
      lastUpdated: payload.generatedAt,
    }));
  } catch (error) {
    telemetryStore.update((current) => ({
      ...current,
      loading: current.marginSeries.length === 0,
      error:
        error instanceof Error
          ? error.message
          : "Unable to reach telemetry service.",
      offline: typeof navigator !== "undefined" && !navigator.onLine,
    }));
  }
};

export const startTelemetry = () => {
  if (pollingHandle) {
    return;
  }

  loadTelemetry();
  pollingHandle = setInterval(loadTelemetry, 15_000);
};

export const stopTelemetry = () => {
  if (pollingHandle) {
    clearInterval(pollingHandle);
    pollingHandle = null;
  }
};
