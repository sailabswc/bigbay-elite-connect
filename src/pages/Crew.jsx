import React, { useEffect, useState } from "react";
import { appRuntime } from "@/api/localRuntime";
import { Users, LifeBuoy, ShieldCheck, Award, Phone } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { formatDate } from "@/lib/format";

const roleStyle = {
  paddler: "bg-sky-50 text-sky-700",
  pilot: "bg-indigo-50 text-indigo-700",
  observer: "bg-violet-50 text-violet-700",
  lifeguard: "bg-emerald-50 text-emerald-700",
  medic: "bg-red-50 text-red-700",
  skipper: "bg-amber-50 text-amber-700",
  safety_officer: "bg-primary/10 text-primary",
};

const statusStyle = {
  available: "bg-emerald-50 text-emerald-700",
  assigned: "bg-blue-50 text-blue-700",
  on_water: "bg-red-50 text-red-600",
  standby: "bg-amber-50 text-amber-700",
  off_duty: "bg-slate-100 text-slate-500",
};

export default function Crew() {
  const [crew, setCrew] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setCrew(await appRuntime.entities.SupportCrew.list()); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const roles = ["all", "safety_officer", "skipper", "paddler", "observer", "lifeguard", "medic", "pilot"];
  const filtered = filter === "all" ? crew : crew.filter(c => c.role === filter);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto">
      <PageHeader title="Support Crew" subtitle="Paddlers, pilots, observers, lifeguards, medics and skippers — the water-safety team that makes every Big Bay swim possible." icon={Users} />

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 mb-5">
        {roles.map(r => (
          <button key={r} onClick={() => setFilter(r)} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${filter === r ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {r === "all" ? "All Roles" : r.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-2xl animate-shimmer" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl ocean-gradient text-white flex items-center justify-center"><LifeBuoy className="w-6 h-6" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold truncate">{c.name}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${roleStyle[c.role]}`}>{c.role.replace("_", " ")}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle[c.status]}`}>{c.status.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground"><Award className="w-3.5 h-3.5" /> {c.experience_years} yrs experience</div>
                {c.vessel && <div className="flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="w-3.5 h-3.5" /> {c.vessel}</div>}
                {c.phone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {c.phone}</div>}
                {c.certifications_expiry && <div className="flex items-center gap-1.5 text-muted-foreground text-xs">Cert valid to {formatDate(c.certifications_expiry)}</div>}
              </div>
              {c.qualifications?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.qualifications.map((q, i) => <span key={i} className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">{q}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}