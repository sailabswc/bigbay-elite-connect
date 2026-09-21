import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { appRuntime } from "@/api/localRuntime";
import { ArrowLeft, MapPin, Waves, Thermometer, Users, CalendarDays, ShieldCheck, Banknote, AlertTriangle, LifeBuoy } from "lucide-react";
import RiskBadge from "@/components/RiskBadge";
import { formatDate, formatCurrency, SWIM_TYPES, EVENT_STATUS } from "@/lib/format";

const statusStyle = {
  pending_screening: "bg-slate-100 text-slate-600",
  screened: "bg-blue-50 text-blue-700",
  cleared: "bg-emerald-50 text-emerald-700",
  conditional: "bg-amber-50 text-amber-700",
  payment_due: "bg-orange-50 text-orange-700",
  paid: "bg-emerald-50 text-emerald-700",
  checked_in: "bg-primary/10 text-primary",
  withdrawn: "bg-red-50 text-red-600 line-through",
  finished: "bg-indigo-50 text-indigo-700",
  dnf: "bg-slate-100 text-slate-500",
};

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const ev = await appRuntime.entities.Event.get(id);
        setEvent(ev);
        const [rg, al, cr] = await Promise.all([
          appRuntime.entities.Registration.filter({ event_id: id }),
          appRuntime.entities.SafetyAlert.filter({ event_id: id }),
          appRuntime.entities.SupportCrew.filter({ assigned_event_id: id }),
        ]);
        setRegistrations(rg);
        setAlerts(al);
        setCrew(cr);
        const swimmerIds = [...new Set(rg.map(r => r.swimmer_id))];
        const sw = await Promise.all(swimmerIds.map(sid => appRuntime.entities.Swimmer.get(sid).catch(() => null)));
        setSwimmers(sw.filter(Boolean));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="p-10 space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl animate-shimmer" />)}</div>;
  if (!event) return <div className="p-10 text-center text-muted-foreground">Event not found.</div>;

  const swimmerMap = Object.fromEntries(swimmers.map(s => [s.id, s]));
  const revenue = registrations.filter(r => r.payment_status === "paid").reduce((s, r) => s + (r.amount || 0), 0);
  const fillPct = Math.round((event.registered_count / event.capacity) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto">
      <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> All events
      </Link>

      <div className="relative rounded-3xl overflow-hidden mb-6 h-56 sm:h-64">
        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur">{EVENT_STATUS[event.status]}</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/90">{SWIM_TYPES[event.swim_type]}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">{event.name}</h1>
          <div className="flex items-center gap-4 mt-1 text-white/80 text-sm flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.start_point} → {event.end_point}</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {formatDate(event.start_date)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Waves, label: "Distance", value: `${event.distance_km} km` },
          { icon: Thermometer, label: "Water Temp", value: `${event.water_temp_c}°C` },
          { icon: Users, label: "Registered", value: `${event.registered_count}/${event.capacity}` },
          { icon: Banknote, label: "Entry Fee", value: formatCurrency(event.entry_fee) },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide"><s.icon className="w-3.5 h-3.5" /> {s.label}</div>
            <div className="mt-1.5 text-xl font-heading font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Registrations */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Registered Swimmers ({registrations.length})</h3>
            <span className="text-xs text-muted-foreground">Revenue: <b className="text-foreground">{formatCurrency(revenue)}</b></span>
          </div>
          <div className="space-y-2 max-h-[460px] overflow-y-auto scrollbar-thin pr-1">
            {registrations.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No registrations yet.</p>}
            {registrations.map(r => {
              const sw = swimmerMap[r.swimmer_id];
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-full ocean-gradient text-white flex items-center justify-center text-xs font-bold">
                    {(sw?.full_name || "?").split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{sw?.full_name || "Unknown"}</span>
                      {sw && <RiskBadge level={sw.screening_risk_level} />}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>Bib {r.bib_number || "—"}</span>
                      <span>·</span>
                      <span className="capitalize">{r.wave} wave</span>
                      {r.finish_time_minutes && <><span>·</span><span>Finish: {r.finish_time_minutes}min{r.placement ? ` (#${r.placement})` : ""}</span></>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusStyle[r.status] || "bg-slate-100"}`}>{r.status.replace(/_/g, " ")}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side: crew + alerts */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold flex items-center gap-2 mb-3"><LifeBuoy className="w-4 h-4 text-ocean-glow" /> Support Crew ({crew.length})</h3>
            <div className="space-y-2">
              {crew.length === 0 && <p className="text-sm text-muted-foreground">No crew assigned yet.</p>}
              {crew.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{c.role}</div>
                  </div>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted">{c.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-accent" /> Safety Alerts ({alerts.length})</h3>
            <div className="space-y-2">
              {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts recorded.</p>}
              {alerts.map(a => (
                <div key={a.id} className={`p-2.5 rounded-xl border text-sm ${a.status === "active" ? "border-accent/30 bg-accent/5" : "border-border"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge level={a.severity === "critical" ? "critical" : a.severity} />
                    <span className="text-xs text-muted-foreground capitalize">{a.type.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}