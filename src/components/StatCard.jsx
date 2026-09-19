import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, sub, icon: Icon, trend, accent = "primary", className }) {
  const accents = {
    primary: "from-primary/10 to-primary/5 text-primary",
    ocean: "from-ocean-glow/15 to-ocean-glow/5 text-ocean-glow",
    coral: "from-accent/10 to-accent/5 text-accent",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600"
  };
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl", accents[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="mt-2 text-3xl font-heading font-bold tracking-tight">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        {Icon && (
          <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center", accents[accent])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend != null && (
        <div className={cn("relative mt-3 text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last cycle
        </div>
      )}
    </div>
  );
}