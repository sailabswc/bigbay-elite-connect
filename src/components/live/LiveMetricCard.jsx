import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDelta, formatMetric } from "@/lib/liveFormat";
import AnimatedNumber from "./AnimatedNumber";
import Sparkline from "./Sparkline";

export default function LiveMetricCard({ metric, icon: Icon }) {
  const up = metric.trend === "up";
  const down = metric.trend === "down";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <Icon className="h-4 w-4 text-secondary-foreground" />
            </div>
          )}
          <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            up
              ? "bg-emerald-50 text-emerald-700"
              : down
                ? "bg-red-50 text-red-600"
                : "bg-muted text-muted-foreground"
          )}
        >
          {up ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : down ? (
            <ArrowDownRight className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          {formatDelta(metric)}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-heading text-2xl font-bold">
          <AnimatedNumber value={metric.value} format={(v) => formatMetric(v, metric)} />
        </span>
        {metric.unit && <span className="text-xs text-muted-foreground">{metric.unit}</span>}
      </div>

      <Sparkline data={metric.series} className="mt-3 h-7 w-full" positive={!down} />
    </div>
  );
}