import React from "react";
import { cn } from "@/lib/utils";
import { riskColor, severityColor } from "@/lib/format";

export default function RiskBadge({ level, className }) {
  const color = riskColor(level);
  const map = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200"
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize", map[color], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", `bg-${color}-500`)} />
      {level}
    </span>
  );
}

export function SeverityBadge({ level, className }) {
  const color = severityColor(level);
  const map = {
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200"
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize", map[color], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", `bg-${color}-500`)} />
      {level}
    </span>
  );
}