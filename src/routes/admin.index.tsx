import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin_kpis"],
    queryFn: async () => {
      const [u, l, r, j] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("marketplace_listings").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return { users: u.count ?? 0, listings: l.count ?? 0, reports: r.count ?? 0, jobs: j.count ?? 0 };
    },
  });
  const items = [
    { label: "Total users", value: data?.users ?? 0 },
    { label: "Active listings", value: data?.listings ?? 0 },
    { label: "Open reports", value: data?.reports ?? 0 },
    { label: "Active jobs", value: data?.jobs ?? 0 },
  ];
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Admin overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <Card key={it.label}><CardContent className="p-5">
            <div className="text-sm text-muted-foreground">{it.label}</div>
            <div className="mt-1 font-display text-3xl font-bold">{it.value.toLocaleString()}</div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
