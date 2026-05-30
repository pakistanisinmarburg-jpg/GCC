import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSkeleton, EmptyState } from "@/components/ui/states";

export const Route = createFileRoute("/notifications")({
  component: () => <RequireAuth><Notifications /></RequireAuth>,
});

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user!.id],
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const markAll = async () => {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user!.id).is("read_at", null);
    if (error) return toast.error(error.message);
    toast.success("Marked all as read");
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  };

  if (isLoading) return <PageSkeleton />;
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Notifications</h1>
        <Button variant="outline" onClick={markAll}>Mark all read</Button>
      </div>
      {!data || data.length === 0 ? <EmptyState title="You're all caught up" /> :
        <div className="space-y-2">
          {data.map((n: any) => (
            <Card key={n.id} className={n.read_at ? "opacity-70" : ""}>
              <CardContent className="p-4">
                <p className="text-sm">{n.title ?? n.body ?? "Notification"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>}
    </div>
  );
}
