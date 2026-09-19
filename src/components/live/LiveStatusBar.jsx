import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LiveStatusBar({ source, secondsAgo, onRefresh, syncing }) {
  const isLive = source === "power_bi";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
      <span className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Live</span>
      </span>

      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
          isLive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {isLive ? "Power BI · streaming" : "Demo feed"}
      </span>

      <span className="text-xs text-muted-foreground">
        {secondsAgo === null ? "Connecting…" : `Synced ${secondsAgo}s ago`}
      </span>

      <Button size="sm" variant="outline" className="ml-auto" onClick={onRefresh} disabled={syncing}>
        <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
        Refresh
      </Button>
    </div>
  );
}