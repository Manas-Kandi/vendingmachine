import { NextResponse } from "next/server";

const baseMetrics = {
  margin: { value: 18.2, delta: 0.4 },
  temperature: { value: 18.0, delta: -0.6 },
  rain: { value: 32.0, delta: 4.5 },
  traffic: { value: 21.0, delta: 1.2 },
};

const reasoningSamples = [
  "Inventory cadence stays gentle—supplier lead time nudged 4 minutes to pre-empt rain shoppers.",
  "Adversary pressure muted; machine widens calm margin band to buffer commuter surge.",
  "Refill drone delayed subtly to ride cheaper grid slot while demand curve stays placid.",
  "Store agent steadied price elasticity after sensing a faint spoofed promo uptick.",
];

const randomReasoning = () =>
  reasoningSamples[Math.floor(Math.random() * reasoningSamples.length)];

const jitter = (value: number, amplitude: number) =>
  Number((value + (Math.random() - 0.5) * amplitude).toFixed(2));

const generateMarginSeries = (base: number, points = 48) => {
  const series: number[] = [];
  let current = base;
  for (let index = 0; index < points; index += 1) {
    current = jitter(current, 0.35);
    series.push(Number(current.toFixed(2)));
  }
  return series;
};

const generateTimeline = (baseMargin: number) => {
  const timeline = [];
  const now = Date.now();
  for (let index = 0; index < 24; index += 1) {
    const timestamp = new Date(now - (23 - index) * 60 * 60 * 1000).toISOString();
    const adversaryPulse = Math.random() > 0.78 ? Math.random() * 6 : 0;
    const marginShift = adversaryPulse ? -adversaryPulse * 0.4 : 0;
    timeline.push({
      timestamp,
      margin: Number((baseMargin + marginShift + Math.random() * 0.8).toFixed(2)),
      adversaryPulse: Number(adversaryPulse.toFixed(2)),
    });
  }
  return timeline;
};

export async function GET() {
  const marginBase = jitter(baseMetrics.margin.value, 0.8);

  const metrics = [
    {
      id: "margin",
      value: marginBase,
      delta: jitter(baseMetrics.margin.delta, 0.4),
    },
    {
      id: "temperature",
      value: jitter(baseMetrics.temperature.value, 1.0),
      delta: jitter(baseMetrics.temperature.delta, 0.8),
    },
    {
      id: "rain",
      value: jitter(baseMetrics.rain.value, 8),
      delta: jitter(baseMetrics.rain.delta, 2),
    },
    {
      id: "traffic",
      value: jitter(baseMetrics.traffic.value, 2),
      delta: jitter(baseMetrics.traffic.delta, 1.2),
    },
  ];

  const marginSeries = generateMarginSeries(marginBase);
  const timeline = generateTimeline(marginBase);
  const reasoning = randomReasoning();

  return NextResponse.json({
    metrics,
    marginSeries,
    timeline,
    reasoning,
    generatedAt: new Date().toISOString(),
  });
}
