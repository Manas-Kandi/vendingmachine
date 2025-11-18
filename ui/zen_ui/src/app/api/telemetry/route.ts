import { NextResponse } from "next/server";

const fallbackPayload = {
  metrics: [
    { id: "margin", label: "Margin", value: 18.2, delta: 0, unit: "%" },
    { id: "temperature", label: "Temperature", value: 18.0, delta: 0, unit: "°C" },
    { id: "rain", label: "Rain", value: 26.0, delta: 0, unit: "mm" },
    { id: "traffic", label: "Traffic", value: 22.0, delta: 0, unit: "idx" },
  ],
  marginSeries: Array.from({ length: 24 }, (_, index) => 17.8 + index * 0.02),
  timeline: [],
  reasoning: "Telemetry service unavailable. Displaying cached reference values.",
  generatedAt: new Date().toISOString(),
  inventory: [],
  orders: [],
  status: { revenue: 0, costs: 0, latencyMs: 0, uptime: 0 },
};

export async function GET() {
  const baseUrl =
    process.env.ZEN_MACHINE_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8000";

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/telemetry`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Telemetry backend responded with", response.status);
      return NextResponse.json(fallbackPayload);
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Unable to reach telemetry backend:", error);
    return NextResponse.json(fallbackPayload);
  }
}
