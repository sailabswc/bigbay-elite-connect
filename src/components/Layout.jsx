import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Waves, LayoutDashboard, CalendarDays, UserPlus, Radio, Users, HeartHandshake, Banknote, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Command Center", icon: LayoutDashboard },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/onboarding", label: "Onboarding", icon: UserPlus },
  { to: "/live", label: "Live Monitor", icon: Radio },
  { to: "/crew", label: "Support Crew", icon: Users },
  { to: "/family", label: "Family Portal", icon: HeartHandshake },
  { to: "/finance", label: "Finance & Sponsors", icon: Banknote },
];

export default function Layout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 ocean-gradient text-white">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-heading font-bold text-lg leading-tight">Big Bay</div>
            <div className="text-[11px] uppercase tracking-widest text-white/60">Events OS</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active ? "bg-white/15 text-white shadow-lg" : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <ShieldAlert className="w-3.5 h-3.5" />
            Water Safety · CLDSA Sanctioned
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg ocean-gradient flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold">Big Bay Events OS</span>
          </div>
        </div>
        <div className="flex overflow-x-auto scrollbar-thin px-2 pb-2 gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 lg:ml-64 pt-28 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}