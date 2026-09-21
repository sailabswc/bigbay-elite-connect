import { useCallback, useEffect, useRef, useState } from "react";
import { appRuntime } from "@/api/localRuntime";

const POLL_MS = 4000;

export default function useLiveMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [source, setSource] = useState("simulated");
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const inFlight = useRef(false);

  const sync = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSyncing(true);
    try {
      const res = await appRuntime.functions.invoke("powerBiLiveSync", {});
      const data = res?.data || {};
      if (Array.isArray(data.metrics) && data.metrics.length) {
        setMetrics(data.metrics);
        setSource(data.source || "simulated");
        setLastSyncAt(data.syncedAt || new Date().toISOString());
      }
    } catch (e) {
      // Keep the last known readings on screen if a sync blips
    } finally {
      inFlight.current = false;
      setSyncing(false);
      setLoading(false);
    }
  }, []);

  // Poll the sync engine — this is the same loop a real Power BI pull would use
  useEffect(() => {
    sync();
    const id = setInterval(sync, POLL_MS);
    return () => clearInterval(id);
  }, [sync]);

  // Realtime push — every viewer's board updates the instant the feed moves
  useEffect(() => {
    const unsubscribe = appRuntime.entities.LiveMetric.subscribe((event) => {
      if (event.type !== "update" && event.type !== "create") return;
      const incoming = event.data;
      setMetrics((prev) => {
        const i = prev.findIndex((m) => m.id === incoming.id);
        if (i === -1) return [...prev, incoming];
        const next = [...prev];
        next[i] = { ...next[i], ...incoming };
        return next;
      });
      setLastSyncAt(incoming.last_sync || new Date().toISOString());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secondsAgo = lastSyncAt
    ? Math.max(0, Math.round((now - new Date(lastSyncAt).getTime()) / 1000))
    : null;

  return { metrics, loading, syncing, source, secondsAgo, sync };
}