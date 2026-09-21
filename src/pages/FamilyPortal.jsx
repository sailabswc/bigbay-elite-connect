import React, { useEffect, useState, useMemo } from "react";
import { appRuntime } from "@/api/localRuntime";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { HeartHandshake, Heart, Gauge, Battery, MapPin, Bell, Share2, Phone, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";

export default function FamilyPortal() {
  const [tracks, setTracks] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tr, sw, ev, al] = await Promise.all([
          appRuntime.entities.LiveTrack.list(),
          appRuntime.entities.Swimmer.list(),
          appRuntime.entities.Event.list(),
          appRuntime.entities.SafetyAlert.list(),
        ]);
        setTracks(tr); setSwimmers(sw); setEvents(ev); setAlerts(al);
        if (tr[0]) setSelected(tr[0].swimmer_id);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const swimmerMap = useMemo(() => Object.fromEntries(swimmers.map(s => [s.id, s])), [swimmers]);
  const liveEvent = useMemo(() => events.find(e => e.status === "live"), [events]);
  const track = useMemo(() => tracks.find(t => t.swimmer_id === selected), [tracks, selected]);
  const swimmer = track ? swimmerMap[track.swimmer_id] : null;
  const myAlerts = useMemo(() => alerts.filter(a => a.swimmer_id === selected && a.status !== "resolved"), [alerts, selected]);

  if (loading) return <div className="p-10 space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-2xl animate-shimmer" />)}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="Family & Team Portal" subtitle="Follow your swimmer live, receive start, finish and safety alerts in real time." icon={HeartHandshake} />

      {liveEvent && (
        <div className="mb-4 rounded-2xl ocean-gradient text-white p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/70 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live event</div>
            <div className="font-heading font-bold text-lg">{liveEvent.name}</div>
            <div className="text-sm text-white/80 flex items-center gap-1"><MapPin className="w-3 h-3" /> {liveEvent.location} · {liveEvent.water_temp_c}°C</div>
          </div>
          <Button variant="secondary" className="bg-white/15 text-white hover:bg-white/25 border-white/20"><Share2 className="w-4 h-4 mr-1" /> Share tracking link</Button>
        </div>
      )}

      {/* Swimmer selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 mb-4">
        {tracks.map(t => {
          const sw = swimmerMap[t.swimmer_id];
          return (
            <button key={t.id} onClick={() => setSelected(t.swimmer_id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap transition-all ${selected === t.swimmer_id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
              <div className="w-7 h-7 rounded-full ocean-gradient text-white flex items-center justify-center text-[10px] font-bold">{(sw?.full_name || "?").split(" ").map(n => n[0]).slice(0, 2).join("")}</div>
              <span className="text-sm font-medium">{sw?.full_name || t.bib_number}</span>
            </button>
          );
        })}
      </div>

      {track && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map */}
          <div className="lg:col-span-2 rounded-2xl border border-border overflow-hidden shadow-sm h-[400px]">
            <MapContainer center={[track.lat, track.lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              <CircleMarker center={[track.lat, track.lng]} radius={14} pathOptions={{ color: track.status === "signal_lost" ? "#ef4444" : "#0ea5e9", fillColor: track.status === "signal_lost" ? "#ef4444" : "#0ea5e9", fillOpacity: 0.8 }}>
                <Popup><b>{swimmer?.full_name}</b><br />{track.status} · {track.progress_pct}% complete</Popup>
              </CircleMarker>
            </MapContainer>
          </div>

          {/* Vitals */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold">{swimmer?.full_name}</h3>
              <p className="text-xs text-muted-foreground mb-4">Bib {track.bib_number} · {track.status === "signal_lost" ? "Signal lost" : "Tracking"}</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><Gauge className="w-4 h-4" /> Progress</span><span className="font-semibold">{track.progress_pct}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full ocean-gradient" style={{ width: `${track.progress_pct}%` }} /></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><Heart className="w-4 h-4" /> Heart rate</span><span className="font-semibold">{track.heart_rate || "—"} bpm</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><Gauge className="w-4 h-4" /> Speed</span><span className="font-semibold">{track.speed_kph} kph</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><Battery className="w-4 h-4" /> Tracker battery</span><span className="font-semibold">{track.battery_pct}%</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Last ping</span><span className="font-semibold">{timeAgo(track.last_ping)}</span></div>
              </div>
            </div>

            {swimmer?.emergency_contacts?.[0] && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Bell className="w-4 h-4 text-accent" /> Emergency contact</h4>
                <div className="text-sm">{swimmer.emergency_contacts[0].name} <span className="text-muted-foreground">({swimmer.emergency_contacts[0].relationship})</span></div>
                <a href={`tel:${swimmer.emergency_contacts[0].phone}`} className="text-sm text-primary flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {swimmer.emergency_contacts[0].phone}</a>
                <p className="text-xs text-muted-foreground mt-2">Auto-notified on start, finish & safety alerts.</p>
              </div>
            )}

            {myAlerts.length > 0 && (
              <div className="rounded-2xl border-2 border-accent/30 bg-accent/5 p-4">
                <h4 className="text-sm font-semibold text-accent mb-2">Alerts for this swimmer</h4>
                {myAlerts.map(a => <p key={a.id} className="text-xs text-muted-foreground">{a.message}</p>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}