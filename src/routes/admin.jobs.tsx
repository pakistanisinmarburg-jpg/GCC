import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/jobs")({ component: Page });
function Page() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_jobs"],
    queryFn: async () => (await supabase.from("jobs").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin_jobs"] });
  };
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Jobs</h1>
      <div className="space-y-2">
        {(data ?? []).map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between p-3">
            <div className="truncate text-sm">{r.position} — {r.company}</div>
            <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
