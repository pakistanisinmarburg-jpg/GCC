import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = ["submitted", "under_review", "resolved", "closed"];

export const Route = createFileRoute("/admin/reports")({ component: Page });
function Page() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_reports"],
    queryFn: async () => (await supabase.from("reports").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin_reports"] });
  };
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Reports</h1>
      <div className="space-y-2">
        {(data ?? []).map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">#{r.id.slice(0, 8)} — {r.incident_type}</div>
              <div className="truncate text-xs text-muted-foreground">{r.description}</div>
            </div>
            <Select defaultValue={r.status} onValueChange={(v) => setStatus(r.id, v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
