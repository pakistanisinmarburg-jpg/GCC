import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton, EmptyState } from "@/components/ui/states";

export const Route = createFileRoute("/reports/$id")({
  component: () => <RequireAuth><ReportDetail /></RequireAuth>,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["report", id, user?.id],
    queryFn: async () => (await supabase.from("reports").select("*").eq("id", id).maybeSingle()).data,
  });
  if (isLoading) return <PageSkeleton />;
  if (!data) return <div className="container mx-auto p-6"><EmptyState title="Not found or no access" /></div>;
  const r = data as any;
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card><CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Report #{r.id.slice(0, 8)}</h1>
          <Badge variant="secondary">{r.status}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{r.incident_type} • {r.incident_date ?? "no date"}</p>
        <p className="mt-6 whitespace-pre-wrap">{r.description}</p>
        {r.perpetrator_description && <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">Perpetrator: {r.perpetrator_description}</p>}
      </CardContent></Card>
    </div>
  );
}
