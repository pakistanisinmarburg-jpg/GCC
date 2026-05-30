import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PageSkeleton, EmptyState } from "@/components/ui/states";

export const Route = createFileRoute("/accommodation/$id")({
  component: AccommodationDetail,
});

function AccommodationDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["accommodation", id],
    queryFn: async () => (await supabase.from("accommodations").select("*").eq("id", id).maybeSingle()).data,
  });
  if (isLoading) return <PageSkeleton />;
  if (!data) return <div className="container mx-auto p-6"><EmptyState title="Not found" /></div>;
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">{(data as any).title}</h1>
      <p className="mt-2 text-2xl font-bold text-primary">€{(data as any).rent}/month</p>
      <p className="mt-4 text-muted-foreground">{(data as any).address}</p>
      <p className="mt-6 whitespace-pre-wrap">{(data as any).description}</p>
    </div>
  );
}
