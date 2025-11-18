import { createStore } from "./store";

export type TelemetryMetric = {
  id: "margin" | "temperature" | "rain" | "traffic" | "latency" | "uptime";
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
  inventory: Array<{ sku: string; stock: number; msrp: number }>;
  orders: Array<{
    sku: string;
    qty: number;
    quotePrice: number;
    deliveryDays: number;
    confidence: number;
  }>;
  status: { revenue: number; costs: number; latencyMs: number; uptime: number } | null;
  offline: boolean;
  loading: boolean;
  error?: string;
  lastUpdated?: string;
};

const initialState: TelemetryState = {
  metrics: [],
  marginSeries: [],
  timeline: [],
  reasoning: "Calibrating supply chain equilibrium...",
  inventory: [],
  orders: [],
  status: null,
  offline: false,
  loading: true,
  error: undefined,
  lastUpdated: undefined,
};

export const telemetryStore = createStore(initialState);

type ApiTelemetry = {
  metrics: TelemetryMetric[];
  marginSeries: number[];
  timeline: TelemetryPoint[];
  reasoning: string;
  generatedAt: string;
  inventory?: TelemetryState["inventory"];
  orders?: TelemetryState["orders"];
  status?: TelemetryState["status"];
};

const API_PATH = "/api/telemetry";

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
      metrics: payload.metrics.length ? payload.metrics : current.metrics,
      marginSeries: payload.marginSeries,
      timeline: payload.timeline,
      reasoning: payload.reasoning,
      inventory: payload.inventory ?? current.inventory,
      orders: payload.orders ?? current.orders,
      status: payload.status ?? current.status,
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
