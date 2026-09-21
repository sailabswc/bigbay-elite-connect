import React, { useEffect, useState, useMemo } from "react";
import { appRuntime } from "@/api/localRuntime";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Radio, AlertTriangle, Heart, Battery, Gauge, Activity, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { SeverityBadge } from "@/components/RiskBadge";
import { timeAgo } from "@/lib/format";

const swimmerColor = (track) => {
  if (track.status === "signal_lost") return "#ef4444";
  if (track.heart_rate > 160) return "#f97316";
  if (track.battery_pct < 20) return "#f59e0b";
  return "#0ea5e9";
};

export default function LiveMonitor() {
  const [tracks, setTracks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tr, al, sw, ev] = await Promise.all([
          appRuntime.entities.LiveTrack.list(),
          appRuntime.entities.SafetyAlert.list(),
          appRuntime.entities.Swimmer.list(),
          appRuntime.entities.Event.list(),
        ]);
        setTracks(tr);
        setAlerts(al);
        setSwimmers(sw);
        setEvents(ev);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
    // subscribe to live updates
    const unsub = appRuntime.entities.LiveTrack.subscribe?.((event) => {
      setTracks(prev => {
        const idx = prev.findIndex(t => t.swimmer_id === event.data?.swimmer_id);
        if (idx === -1) return [event.data, ...prev];
        const copy = [...prev]; copy[idx] = { ...copy[idx], ...event.data }; return copy;
      });
    });
    return () => unsub && unsub();
  }, []);

  const liveEvent = useMemo(() => events.find(e => e.status === "live"), [events]);
  const swimmerMap = useMemo(() => Object.fromEntries(swimmers.map(s => [s.id, s])), [swimmers]);
  const activeAlerts = useMemo(() => alerts.filter(a => a.status === "active"), [alerts]);

  if (loading) return <div className="p-10 space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl animate-shimmer" />)}</div>;

  const center = tracks.length ? [tracks[0].lat, tracks[0].lng] : [-33.8, 18.46];

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto">
      <PageHeader
        title="Live Event Monitor"
        subtitle={liveEvent ? `Real-time tracking · ${liveEvent.name}` : "Real-time swimmer GPS, vitals & safety alerts"}
        icon={Radio}
        actions={liveEvent && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
          </div>
        )}
      />

      {activeAlerts.length > 0 && (
        <div className="mb-4 rounded-2xl border-2 border-accent/40 bg-accent/5 p-4">
          <div className="flex items-center gap-2 text-accent font-semibold mb-2"><ShieldAlert className="w-5 h-5" /> {activeAlerts.length} Active Safety Alert{activeAlerts.length > 1 ? "s" : ""}</div>
          <div className="space-y-2">
            {activeAlerts.map(a => (
              <div key={a.id} className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
                <SeverityBadge level={a.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium capitalize">{a.type.replace("_", " ")}</div>
                  <p className="text-xs text-muted-foreground">{a.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(a.created_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl border border-border overflow-hidden shadow-sm h-[560px]">
          <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {tracks.map(t => (
              <CircleMarker key={t.id} center={[t.lat, t.lng]} radius={10} pathOptions={{ color: swimmerColor(t), fillColor: swimmerColor(t), fillOpacity: 0.8 }}
                eventHandlers={{ click: () => setSelected(t.swimmer_id) }}>
                <Popup>
                  <div className="text-sm">
                    <b>{swimmerMap[t.swimmer_id]?.full_name || t.bib_number}</b><br />
                    Bib: {t.bib_number} · {t.status}<br />
                    HR: {t.heart_rate}bpm · {t.speed_kph}kph<br />
                    Progress: {t.progress_pct}% · Battery: {t.battery_pct}%
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Swimmer list */}
        <div className="rounded-2xl border border-border bg-card p-4 h-[560px] flex flex-col">
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Swimmers on Water ({tracks.length})</h3>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
            {tracks.map(t => {
              const sw = swimmerMap[t.swimmer_id];
              const isSel = selected === t.swimmer_id;
              return (
                <button key={t.id} onClick={() => setSelected(t.swimmer_id)} className={`w-full text-left p-3 rounded-xl border transition-all ${isSel ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: swimmerColor(t) }}>
                      {(sw?.full_name || "?").split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{sw?.full_name || t.bib_number}</div>
                      <div className="text-xs text-muted-foreground">{t.bib_number} · {t.progress_pct}% complete</div>
                    </div>
                    {t.status === "signal_lost" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground"><Heart className="w-3 h-3" /> {t.heart_rate || "—"}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Gauge className="w-3 h-3" /> {t.speed_kph}kph</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Battery className="w-3 h-3" /> {t.battery_pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}