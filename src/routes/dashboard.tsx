import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ShoppingBag,
  Home,
  Briefcase,
  MessageSquareQuote,
  Shield,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Marburg Connect" }] }),
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

function Dashboard() {
  const { user, profile } = useAuth();

  const { data: counts, isLoading } = useQuery({
    queryKey: ["dashboard_counts", user!.id],
    queryFn: async () => {
      const [c, m, a, j, q, r] = await Promise.all([
        supabase.from("community_members").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("marketplace_listings").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("accommodations").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("questions").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      return {
        communities: c.count ?? 0,
        marketplace: m.count ?? 0,
        accommodation: a.count ?? 0,
        jobs: j.count ?? 0,
        qa: q.count ?? 0,
        reports: r.count ?? 0,
      };
    },
  });

  const tiles = [
    { to: "/communities" as const, label: "Communities", icon: Users, value: counts?.communities, note: "Your memberships" },
    { to: "/marketplace" as const, label: "Marketplace", icon: ShoppingBag, value: counts?.marketplace, note: "Active listings" },
    { to: "/accommodation" as const, label: "Accommodation", icon: Home, value: counts?.accommodation, note: "Available now" },
    { to: "/jobs" as const, label: "Jobs", icon: Briefcase, value: counts?.jobs, note: "Open positions" },
    { to: "/qa" as const, label: "Q&A", icon: MessageSquareQuote, value: counts?.qa, note: "Questions asked" },
    { to: "/reports/new" as const, label: "Report discrimination", icon: Shield, value: counts?.reports, note: "Your reports" },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold md:text-4xl">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">Here's what's happening across Marburg Connect.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="group">
            <Card className="h-full border-border/60 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <t.icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-6 font-display text-lg font-semibold">{t.label}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  {isLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    <span className="font-display text-2xl font-bold">{(t.value ?? 0).toLocaleString()}</span>
                  )}
                  <span className="text-sm text-muted-foreground">{t.note}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
