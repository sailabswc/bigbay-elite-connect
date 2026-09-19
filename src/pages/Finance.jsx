import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Banknote, TrendingUp, Trophy, Receipt, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

const tierStyle = {
  title: "bg-primary/10 text-primary",
  platinum: "bg-slate-100 text-slate-700",
  gold: "bg-amber-100 text-amber-700",
  silver: "bg-slate-100 text-slate-600",
  bronze: "bg-orange-50 text-orange-700",
  partner: "bg-muted text-muted-foreground",
};

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tx, sp] = await Promise.all([base44.entities.Transaction.list(), base44.entities.Sponsor.list()]);
        setTransactions(tx); setSponsors(sp);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.status === "completed" && t.type !== "refund").reduce((s, t) => s + (t.amount || 0), 0);
    const refunds = transactions.filter(t => t.type === "refund").reduce((s, t) => s + (t.amount || 0), 0);
    const sponsorTotal = sponsors.filter(s => s.active).reduce((s, sp) => s + (sp.contribution || 0), 0);
    const entryTotal = transactions.filter(t => t.type === "entry_fee" && t.status === "completed").reduce((s, t) => s + (t.amount || 0), 0);
    const donationTotal = transactions.filter(t => t.type === "donation" && t.status === "completed").reduce((s, t) => s + (t.amount || 0), 0);
    return { income, refunds, net: income - refunds, sponsorTotal, entryTotal, donationTotal };
  }, [transactions, sponsors]);

  const byType = useMemo(() => {
    const map = { entry_fee: 0, sponsorship: 0, donation: 0, merchandise: 0 };
    transactions.filter(t => t.status === "completed" && t.type !== "refund").forEach(t => { map[t.type] = (map[t.type] || 0) + (t.amount || 0); });
    return [
      { type: "Entry Fees", amount: map.entry_fee },
      { type: "Sponsorship", amount: map.sponsorship },
      { type: "Donations", amount: map.donation },
      { type: "Merch", amount: map.merchandise },
    ];
  }, [transactions]);

  if (loading) return <div className="p-10 space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl animate-shimmer" />)}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto">
      <PageHeader title="Finance & Sponsors" subtitle="Total funds, revenue breakdown, sponsorships and transaction ledger." icon={Banknote} actions={<Button className="bg-primary"><Plus className="w-4 h-4 mr-1" /> Record Transaction</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Net Revenue" value={formatCurrency(stats.net)} sub={`${transactions.length} transactions`} icon={TrendingUp} accent="emerald" trend={24} />
        <StatCard label="Sponsorship" value={formatCurrency(stats.sponsorTotal)} sub={`${sponsors.filter(s => s.active).length} partners`} icon={Trophy} accent="amber" />
        <StatCard label="Entry Fees" value={formatCurrency(stats.entryTotal)} sub="Swimmer registrations" icon={Receipt} accent="primary" />
        <StatCard label="Donations" value={formatCurrency(stats.donationTotal)} sub="Community support" icon={Banknote} accent="ocean" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold mb-4">Revenue by Source</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(205 30% 90%)" />
              <XAxis dataKey="type" tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }} tickFormatter={(v) => `R${v / 1000}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(205 30% 90%)", fontSize: 13 }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {byType.map((_, i) => <Cell key={i} fill={["hsl(205 85% 38%)", "hsl(43 80% 58%)", "hsl(190 85% 42%)", "hsl(262 60% 58%)"][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Sponsors</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
            {sponsors.map(sp => (
              <div key={sp.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold uppercase">{sp.name.slice(0, 2)}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{sp.name}</div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${tierStyle[sp.tier]}`}>{sp.tier}</span>
                  </div>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(sp.contribution)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading font-semibold mb-4">Transaction Ledger</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="py-2 pr-4">Reference</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Method</th><th className="py-2 pr-4">Status</th><th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="py-2.5 pr-4 font-mono text-xs">{t.reference}</td>
                  <td className="py-2.5 pr-4 capitalize">{t.type.replace("_", " ")}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{formatDate(t.paid_date)}</td>
                  <td className="py-2.5 pr-4 capitalize">{t.method}</td>
                  <td className="py-2.5 pr-4"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${t.status === "completed" ? "bg-emerald-50 text-emerald-700" : t.status === "refunded" ? "bg-orange-50 text-orange-700" : "bg-slate-100"}`}>{t.status}</span></td>
                  <td className={`py-2.5 text-right font-semibold ${t.type === "refund" ? "text-red-500" : "text-foreground"}`}>{t.type === "refund" ? "-" : ""}{formatCurrency(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}