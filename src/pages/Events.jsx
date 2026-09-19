import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CalendarDays, MapPin, Waves, Thermometer, Users, ArrowRight, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { formatDate, formatCurrency, SWIM_TYPES, EVENT_STATUS } from "@/lib/format";
import { Button } from "@/components/ui/button";

const statusStyle = {
  draft: "bg-slate-100 text-slate-600",
  open: "bg-emerald-50 text-emerald-700",
  screening: "bg-amber-50 text-amber-700",
  live: "bg-red-50 text-red-600",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-slate-100 text-slate-500 line-through",
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ev = await base44.entities.Event.list("start_date");
        setEvents(ev);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto">
      <PageHeader
        title="Events"
        subtitle="Every Big Bay swim — from Robben Island crossings to community bay splashes. Manage capacity, screening, safety crew and revenue in one place."
        icon={CalendarDays}
        actions={<Button className="bg-primary"><Plus className="w-4 h-4 mr-1" /> New Event</Button>}
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-72 rounded-2xl animate-shimmer" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {events.map(e => {
            const fillPct = Math.min(100, Math.round(((e.registered_count || 0) / (e.capacity || 1)) * 100));
            return (
              <Link key={e.id} to={`/events/${e.id}`} className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-0.5">
                <div className="relative h-40 overflow-hidden">
                  <img src={e.image_url} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[e.status]}`}>{EVENT_STATUS[e.status]}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-700">{SWIM_TYPES[e.swim_type]}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-heading font-bold text-lg leading-tight">{e.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-white/80"><MapPin className="w-3 h-3" /> {e.location}</div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Waves className="w-3.5 h-3.5" /> {e.distance_km} km</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Thermometer className="w-3.5 h-3.5" /> {e.water_temp_c}°C</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="w-3.5 h-3.5" /> {formatDate(e.start_date)}</span>
                  </div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {e.registered_count}/{e.capacity} registered</span>
                    <span className="font-semibold text-primary">{formatCurrency(e.entry_fee)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full ocean-gradient" style={{ width: `${fillPct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Sanctioned by {e.sanctioned_by}</span>
                    <span className="text-xs font-semibold text-primary flex items-center gap-0.5 group-hover:gap-1.5 transition-all">View <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}