export const formatCurrency = (amount, currency = "ZAR") => {
  if (amount == null || isNaN(amount)) return "—";
  const symbol = currency === "ZAR" ? "R" : "";
  return `${symbol}${Number(amount).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const riskColor = (level) => ({
  low: "emerald",
  moderate: "amber",
  high: "orange",
  severe: "red",
  critical: "red"
}[level] || "slate");

export const severityColor = (level) => ({
  info: "sky",
  warning: "amber",
  urgent: "orange",
  critical: "red"
}[level] || "slate");

export const SWIM_TYPES = {
  channel_crossing: "Channel Crossing",
  round_island: "Round Island",
  coastal_dash: "Coastal Dash",
  bay_swim: "Bay Swim",
  training_camp: "Training Camp",
  adventure_swim: "Adventure Swim"
};

export const EVENT_STATUS = {
  draft: "Draft",
  open: "Open",
  screening: "Screening",
  live: "Live",
  completed: "Completed",
  cancelled: "Cancelled"
};

export const ageFromDob = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
};