import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/qa")({ component: Page });
function Page() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_qa"],
    queryFn: async () => (await supabase.from("questions").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("questions").delete().eq("id", id);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin_qa"] });
  };
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Q&amp;A</h1>
      <div className="space-y-2">
        {(data ?? []).map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between p-3">
            <div className="truncate text-sm">{r.title}</div>
            <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
