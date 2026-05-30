import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/marketplace")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_marketplace"],
    queryFn: async () => (await supabase.from("marketplace_listings").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const remove = async (id: string) => {
    if (!confirm("Delete listing?")) return;
    await supabase.from("marketplace_listings").delete().eq("id", id);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin_marketplace"] });
  };
  const toggleActive = async (id: string, v: boolean) => {
    await supabase.from("marketplace_listings").update({ is_active: v }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin_marketplace"] });
  };
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Marketplace</h1>
      <div className="space-y-2">
        {(data ?? []).map((r: any) => (
          <Card key={r.id}><CardContent className="flex items-center justify-between gap-3 p-3">
            <div className="truncate text-sm">{r.title} — €{r.price}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toggleActive(r.id, !r.is_active)}>{r.is_active ? "Deactivate" : "Activate"}</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
