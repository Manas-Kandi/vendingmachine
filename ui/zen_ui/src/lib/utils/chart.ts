const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const buildLinePath = (
  values: number[],
  width: number,
  height: number,
) => {
  if (!values.length) {
    return "";
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1 || 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return [clamp(x, 0, width), clamp(y, 0, height)];
  });

  return points
    .map(([x, y], index) =>
      index === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(" ");
};

export const normalizeTimeline = (
  timeline: Array<{ timestamp: string; adversaryPulse: number }>,
) => {
  const maxPulse =
    timeline.reduce((acc, point) => Math.max(acc, point.adversaryPulse), 0) ||
    1;

  return timeline.map((point) => ({
    ...point,
    intensity: point.adversaryPulse / maxPulse,
  }));
};
