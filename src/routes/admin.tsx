import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, Image, Layers, ShoppingBag, Home, Briefcase, MessageSquareQuote, Shield, Settings } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Marburg Connect" }] }),
  component: () => <RequireAuth role="admin"><AdminLayout /></RequireAuth>,
});

const ITEMS = [
  { to: "/admin" as const, label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/users" as const, label: "Users", icon: Users },
  { to: "/admin/slider" as const, label: "Slider", icon: Image },
  { to: "/admin/communities" as const, label: "Communities", icon: Layers },
  { to: "/admin/marketplace" as const, label: "Marketplace", icon: ShoppingBag },
  { to: "/admin/accommodation" as const, label: "Accommodation", icon: Home },
  { to: "/admin/jobs" as const, label: "Jobs", icon: Briefcase },
  { to: "/admin/qa" as const, label: "Q&A", icon: MessageSquareQuote },
  { to: "/admin/reports" as const, label: "Reports", icon: Shield },
  { to: "/admin/settings" as const, label: "Settings", icon: Settings },
];

function AdminLayout() {
  const loc = useLocation();
  return (
    <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border bg-card p-3">
        <nav className="flex flex-col gap-1">
          {ITEMS.map((it) => {
            const active = it.exact ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                <it.icon className="h-4 w-4" />{it.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}
