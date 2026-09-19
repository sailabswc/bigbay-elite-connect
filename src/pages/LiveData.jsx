import React, { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Radio,
  Thermometer,
  Ticket,
  Timer,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import useLiveMetrics from "@/hooks/useLiveMetrics";
import LiveStatusBar from "@/components/live/LiveStatusBar";
import LiveMetricCard from "@/components/live/LiveMetricCard";
import RevenueChart from "@/components/live/RevenueChart";
import AnimatedNumber from "@/components/live/AnimatedNumber";
import { formatMetric } from "@/lib/liveFormat";

const ICONS = {
  entries_sold: Ticket,
  revenue: Banknote,
  swimmers_live: Radio,
  water_temp: Thermometer,
  avg_pace: Timer,
  active_alerts: AlertTriangle,
  signal_health: Activity,
};

const ORDER = [
  "entries_sold",
  "revenue",
  "swimmers_live",
  "water_temp",
  "avg_pace",
  "active_alerts",
  "signal_health",
];

export default function LiveData() {
  const { metrics, loading, syncing, source, secondsAgo, sync } = useLiveMetrics();

  const sorted = useMemo(
    () => [...metrics].sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key)),
    [metrics]
  );

  const revenue = metrics.find((m) => m.key === "revenue");

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-10">
      <PageHeader
        title="Live Intelligence"
        subtitle="Every figure below streams in the moment it changes — no refresh, no report to open. This is the board that replaces the Power BI dashboard."
        icon={Activity}
      />

      <LiveStatusBar
        source={source}
        secondsAgo={secondsAgo}
        onRefresh={sync}
        syncing={syncing}
      />

      {loading && metrics.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((metric) => (
              <LiveMetricCard key={metric.id} metric={metric} icon={ICONS[metric.key]} />
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold">Revenue — live</h2>
                <p className="text-xs text-muted-foreground">
                  Last {revenue?.series?.length || 0} readings, updating as entries land
                </p>
              </div>
              <span className="font-heading text-xl font-bold">
                <AnimatedNumber
                  value={revenue?.value || 0}
                  format={(v) => formatMetric(v, revenue)}
                />
              </span>
            </div>
            <RevenueChart series={revenue?.series || []} />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Demo feed active. Once the client's Power BI credentials are connected, this board
            streams their real dataset — the interface does not change.
          </p>
        </>
      )}
    </div>
  );
}