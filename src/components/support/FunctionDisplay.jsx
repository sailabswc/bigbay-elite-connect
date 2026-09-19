import React, { useState } from "react";
import { ChevronRight, Loader2, CheckCircle2, XCircle, Wrench } from "lucide-react";

const STATUS_LABEL = {
  pending: "Queued",
  running: "Running",
  in_progress: "Running",
  completed: "Done",
  success: "Done",
  failed: "Failed",
  error: "Failed",
};

const isFailed = (tc) => {
  if (["failed", "error"].includes(tc.status)) return true;
  if (typeof tc.results === "string" && /error|failed/i.test(tc.results)) return true;
  try {
    const parsed = typeof tc.results === "string" ? JSON.parse(tc.results) : tc.results;
    return parsed?.success === false;
  } catch {
    return false;
  }
};

const pretty = (val) => {
  if (val == null) return "";
  try {
    return JSON.stringify(typeof val === "string" ? JSON.parse(val) : val, null, 2);
  } catch {
    return String(val);
  }
};

export default function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const failed = isFailed(toolCall);
  const running = ["pending", "running", "in_progress"].includes(toolCall.status);
  const proj = toolCall.display_projection;

  if (proj?.hide_details && proj?.details_redacted) {
    const label = failed ? (proj.error_label || "Failed") : running ? (proj.active_label || "Working…") : (proj.label || "Done");
    return <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5"><Wrench className="w-3 h-3" />{label}</div>;
  }

  const name = (toolCall.name || "tool").replace(/_/g, " ");
  const statusText = STATUS_LABEL[toolCall.status] || "Working";

  return (
    <div className="mt-2 text-xs rounded-lg border border-border bg-muted/40 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/70 transition-colors">
        <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
        {running ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : failed ? <XCircle className="w-3 h-3 text-red-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        <span className="font-medium capitalize">{name}</span>
        <span className="text-muted-foreground">{statusText}</span>
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2">
          {toolCall.arguments_string && (
            <div>
              <div className="font-semibold text-muted-foreground mb-0.5">Parameters</div>
              <pre className="whitespace-pre-wrap break-words bg-background rounded-md p-2 text-[11px] max-h-40 overflow-auto scrollbar-thin">{pretty(toolCall.arguments_string)}</pre>
            </div>
          )}
          {toolCall.results != null && (
            <div>
              <div className="font-semibold text-muted-foreground mb-0.5">Result</div>
              <pre className="whitespace-pre-wrap break-words bg-background rounded-md p-2 text-[11px] max-h-52 overflow-auto scrollbar-thin">{pretty(toolCall.results)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}