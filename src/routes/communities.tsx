import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/states";

export const Route = createFileRoute("/communities")({
  head: () => ({ meta: [{ title: "Communities — Marburg Connect" }] }),
  component: CommunitiesList,
});

const CATEGORIES = ["All", "Cultural", "Language", "Hobby", "Professional", "Religious", "Student", "Support", "Sports", "Other"];

interface Community {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  cover_image: string | null;
  member_count?: number | null;
}

function CommunitiesList() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["communities", q, cat],
    queryFn: async () => {
      let query = supabase.from("communities").select("*").order("created_at", { ascending: false });
      if (q) query = query.ilike("name", `%${q}%`);
      if (cat !== "All") query = query.eq("category", cat);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Community[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Communities</h1>
          <p className="mt-1 text-muted-foreground">Find groups of people who share your background, interests or goals.</p>
        </div>
        <Button asChild>
          <Link to="/communities/new"><Plus className="mr-2 h-4 w-4" /> Create community</Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search communities..." className="pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No communities yet"
          description="Be the first to create one for your group or interest."
          action={user ? <Button asChild><Link to="/communities/new">Create community</Link></Button> : null}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <Link key={c.id} to="/communities/$id" params={{ id: c.id }}>
              <Card className="h-full overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                  {c.cover_image ? (
                    <img src={c.cover_image} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                      <Users className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                    {c.category && <Badge variant="secondary">{c.category}</Badge>}
                  </div>
                  {c.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
