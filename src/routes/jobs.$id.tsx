import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PageSkeleton, EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/jobs/$id")({ component: JobDetail });

function JobDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => (await supabase.from("jobs").select("*").eq("id", id).maybeSingle()).data,
  });
  if (isLoading) return <PageSkeleton />;
  if (!data) return <div className="container mx-auto p-6"><EmptyState title="Not found" /></div>;
  const j = data as any;
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">{j.position}</h1>
      <p className="mt-1 text-muted-foreground">{j.company} • {j.location}</p>
      <div className="mt-3 flex gap-2">{j.job_type && <Badge>{j.job_type}</Badge>}{j.salary_range && <Badge variant="secondary">{j.salary_range}</Badge>}</div>
      <h2 className="mt-8 font-display text-xl font-semibold">Description</h2>
      <p className="mt-2 whitespace-pre-wrap text-foreground/80">{j.description}</p>
      {j.requirements && <><h2 className="mt-6 font-display text-xl font-semibold">Requirements</h2><p className="mt-2 whitespace-pre-wrap text-foreground/80">{j.requirements}</p></>}
    </div>
  );
}
