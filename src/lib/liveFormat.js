export function formatMetric(value, metric) {
  if (!metric) return String(value ?? "");
  const decimals = metric.decimals ?? 0;
  const n = Number(value) || 0;
  const body = n.toLocaleString("en-ZA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return metric.format === "currency" ? `R ${body}` : body;
}

export function formatDelta(metric) {
  const decimals = metric?.decimals ?? 0;
  const d = Math.abs(Number(metric?.delta) || 0);
  if (d >= 1000) return `${(d / 1000).toFixed(1)}k`;
  return d.toFixed(decimals);
}