import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Waves, Users, CalendarDays, Banknote, ShieldAlert, TrendingUp, Activity, AlertTriangle, Trophy, MapPin } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import StatCard from "@/components/StatCard";
import RiskBadge from "@/components/RiskBadge";
import { formatCurrency, formatDate, timeAgo, SWIM_TYPES, EVENT_STATUS } from "@/lib/format";

const CHART_COLORS = ["hsl(205 85% 38%)", "hsl(190 85% 42%)", "hsl(7 78% 52%)", "hsl(43 80% 58%)", "hsl(262 60% 58%)"];

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ev, sw, rg, al, tx, sp] = await Promise.all([
          base44.entities.Event.list(),
          base44.entities.Swimmer.list(),
          base44.entities.Registration.list(),
          base44.entities.SafetyAlert.list(),
          base44.entities.Transaction.list(),
          base44.entities.Sponsor.list(),
        ]);
        setEvents(ev);
        setSwimmers(sw);
        setRegistrations(rg);
        setAlerts(al);
        setTransactions(tx);
        setSponsors(sp);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const revenue = transactions.filter(t => t.status === "completed" && t.type !== "refund").reduce((s, t) => s + (t.amount || 0), 0);
    const refunds = transactions.filter(t => t.type === "refund").reduce((s, t) => s + (t.amount || 0), 0);
    const activeAlerts = alerts.filter(a => a.status === "active");
    const liveEvent = events.find(e => e.status === "live");
    const totalRegs = registrations.length;
    const cleared = registrations.filter(r => r.status === "cleared" || r.status === "paid" || r.status === "checked_in").length;
    return { revenue, refunds, activeAlerts, liveEvent, totalRegs, cleared, netRevenue: revenue - refunds };
  }, [transactions, alerts, events, registrations]);

  const revenueByMonth = useMemo(() => {
    const months = {};
    transactions.filter(t => t.status === "completed" && t.type !== "refund").forEach(t => {
      const d = new Date(t.paid_date);
      const key = d.toLocaleDateString("en-ZA", { month: "short" });
      months[key] = (months[key] || 0) + (t.amount || 0);
    });
    return Object.entries(months).map(([month, amount]) => ({ month, amount }));
  }, [transactions]);

  const regsByEvent = useMemo(() => {
    return events.map(e => ({
      name: e.name.length > 18 ? e.name.slice(0, 16) + "…" : e.name,
      registered: e.registered_count || 0,
      capacity: e.capacity || 0,
    }));
  }, [events]);

  const riskDist = useMemo(() => {
    const dist = { low: 0, moderate: 0, high: 0, critical: 0 };
    swimmers.forEach(s => { dist[s.screening_risk_level] = (dist[s.screening_risk_level] || 0) + 1; });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [swimmers]);

  const acclimatizationDist = useMemo(() => {
    const dist = {};
    swimmers.forEach(s => { dist[s.acclimatization_level] = (dist[s.acclimatization_level] || 0) + 1; });
    const order = ["none", "beginner", "intermediate", "experienced", "elite"];
    return order.filter(k => dist[k]).map(k => ({ level: k, count: dist[k] }));
  }, [swimmers]);

  const genderDist = useMemo(() => {
    const dist = { male: 0, female: 0 };
    swimmers.forEach(s => { if (dist[s.gender] !== undefined) dist[s.gender]++; });
    return [{ name: "Male", value: dist.male }, { name: "Female", value: dist.female }];
  }, [swimmers]);

  const sponsorTotal = useMemo(() => sponsors.filter(s => s.active).reduce((s, sp) => s + (sp.contribution || 0), 0), [sponsors]);

  if (loading) {
    return (
      <div className="p-6 lg:p-10 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl ocean-gradient text-white p-6 sm:p-8 mb-6">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, white 0, transparent 35%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/70 text-sm font-medium uppercase tracking-widest">
              <Waves className="w-4 h-4" /> Big Bay Events · Command Center
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-heading font-bold tracking-tight">Water Safety Operations</h1>
            <p className="mt-2 text-white/80 max-w-xl">Real-time visibility across every swim, swimmer, support vessel and rand of revenue — the operating system for Cape open-water swimming.</p>
          </div>
          {stats.liveEvent && (
            <div className="glass-dark rounded-2xl px-5 py-4 border border-white/20">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Now
              </div>
              <div className="mt-1 font-heading font-bold text-lg">{stats.liveEvent.name}</div>
              <div className="text-white/70 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> {stats.liveEvent.location}</div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Net Revenue" value={formatCurrency(stats.netRevenue)} sub={`${transactions.length} transactions`} icon={Banknote} accent="emerald" trend={24} />
        <StatCard label="Registrations" value={stats.totalRegs} sub={`${stats.cleared} cleared to race`} icon={Users} accent="primary" trend={18} />
        <StatCard label="Active Swimmers" value={swimmers.length} sub={`${swimmers.filter(s => s.screening_status === "cleared").length} cleared`} icon={Activity} accent="ocean" trend={12} />
        <StatCard label="Safety Alerts" value={stats.activeAlerts.length} sub={stats.activeAlerts.length > 0 ? "Requires attention" : "All clear"} icon={ShieldAlert} accent={stats.activeAlerts.length > 0 ? "coral" : "emerald"} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold">Revenue Flow</h3>
              <p className="text-xs text-muted-foreground">Entry fees, sponsorships & donations</p>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(205 85% 38%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(205 85% 38%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(205 30% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }} tickFormatter={(v) => `R${v / 1000}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(205 30% 90%)", fontSize: 13 }} />
              <Area type="monotone" dataKey="amount" stroke="hsl(205 85% 38%)" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading font-semibold mb-1">Risk Distribution</h3>
          <p className="text-xs text-muted-foreground mb-2">Screened swimmer profiles</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {riskDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(205 30% 90%)", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {riskDist.map((r, i) => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 capitalize"><span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />{r.name}</span>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading font-semibold mb-1">Event Capacity & Registration</h3>
          <p className="text-xs text-muted-foreground mb-4">Registered vs capacity across the season</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={regsByEvent} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(205 30% 90%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(215 20% 45%)" }} width={120} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(205 30% 90%)", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="registered" fill="hsl(205 85% 38%)" radius={[0, 6, 6, 0]} />
              <Bar dataKey="capacity" fill="hsl(205 30% 85%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading font-semibold mb-1">Acclimatization Levels</h3>
          <p className="text-xs text-muted-foreground mb-4">Cold-water readiness of the field</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart data={acclimatizationDist} innerRadius={30} outerRadius={100} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="count" cornerRadius={8} background>
                {acclimatizationDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </RadialBar>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(205 30% 90%)", fontSize: 13 }} />
              <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11, textTransform: "capitalize" }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live alerts + Sponsors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-accent" /> Safety Alert Feed</h3>
            <span className="text-xs text-muted-foreground">{alerts.length} total</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {alerts.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No alerts — all swimmers tracking normally.</p>}
            {alerts.map(a => (
              <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${a.status === "active" ? "border-accent/30 bg-accent/5" : "border-border bg-muted/40"}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 ${a.status === "active" ? "bg-accent animate-pulse" : "bg-muted-foreground/40"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold capitalize">{a.type.replace("_", " ")}</span>
                    <RiskBadge level={a.severity === "critical" ? "critical" : a.severity} />
                    <span className="text-xs text-muted-foreground">{timeAgo(a.created_date)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Sponsorship</h3>
          </div>
          <div className="text-3xl font-heading font-bold">{formatCurrency(sponsorTotal)}</div>
          <p className="text-xs text-muted-foreground mb-4">{sponsors.filter(s => s.active).length} active partners</p>
          <div className="space-y-2">
            {sponsors.filter(s => s.active).slice(0, 6).map(sp => (
              <div key={sp.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold uppercase">{sp.name.slice(0, 2)}</div>
                  <span className="text-sm font-medium">{sp.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{sp.tier}</span>
                  <span className="text-sm font-semibold">{formatCurrency(sp.contribution)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}