import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function makeAdminCrud(table: string, label: string, titleField: string) {
  return function Page() {
    const qc = useQueryClient();
    const { data } = useQuery({
      queryKey: [`admin_${table}`],
      queryFn: async () => (await supabase.from(table).select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
    });
    const remove = async (id: string) => {
      if (!confirm(`Delete this ${label}?`)) return;
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: [`admin_${table}`] });
    };
    return (
      <div>
        <h1 className="mb-6 font-display text-2xl font-bold capitalize">{label}</h1>
        <div className="space-y-2">
          {(data ?? []).map((row: any) => (
            <Card key={row.id}><CardContent className="flex items-center justify-between p-3">
              <div className="truncate text-sm">{row[titleField] ?? row.id}</div>
              <Button size="sm" variant="ghost" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent></Card>
          ))}
        </div>
      </div>
    );
  };
}

export const Route = createFileRoute("/admin/communities")({ component: makeAdminCrud("communities", "communities", "name") });
