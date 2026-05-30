import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, ShoppingBag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/states";

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — Marburg Connect" }] }),
  component: MarketplaceList,
});

const CATEGORIES = ["All", "Furniture", "Electronics", "Books", "Clothing", "Bikes", "Kitchen", "Free", "Other"];

interface Listing {
  id: string;
  title: string;
  price: number | null;
  currency?: string | null;
  category: string | null;
  location: string | null;
  main_image?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  created_at: string;
  seller_id?: string | null;
}

function MarketplaceList() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["marketplace", q, cat, min, max],
    queryFn: async () => {
      let query = supabase
        .from("marketplace_listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (q) query = query.ilike("title", `%${q}%`);
      if (cat !== "All") query = query.eq("category", cat);
      if (min) query = query.gte("price", Number(min));
      if (max) query = query.lte("price", Number(max));
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Listing[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Marketplace</h1>
          <p className="mt-1 text-muted-foreground">Buy and sell second-hand items within Marburg's network.</p>
        </div>
        <Button asChild>
          <Link to="/marketplace/new"><Plus className="mr-2 h-4 w-4" /> Create listing</Link>
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_120px_120px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="number" placeholder="Min €" value={min} onChange={(e) => setMin(e.target.value)} />
        <Input type="number" placeholder="Max €" value={max} onChange={(e) => setMax(e.target.value)} />
      </div>

      {isLoading ? <CardSkeleton /> :
        error ? <ErrorState error={error} onRetry={refetch} /> :
        !data || data.length === 0 ? (
          <EmptyState title="No listings yet" description="Be the first to post something for sale."
            action={user ? <Button asChild><Link to="/marketplace/new">Create listing</Link></Button> : null} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((l) => (
              <Link key={l.id} to="/marketplace/$id" params={{ id: l.id }}>
                <Card className="h-full overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <div className="aspect-square w-full overflow-hidden bg-muted">
                    {l.main_image ? <img src={l.main_image} alt={l.title} className="h-full w-full object-cover" /> :
                      <div className="grid h-full w-full place-items-center text-muted-foreground"><ShoppingBag className="h-10 w-10" /></div>}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="line-clamp-1 font-semibold">{l.title}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-display text-lg font-bold text-primary">
                        {l.price != null ? `€${Number(l.price).toLocaleString()}` : "Free"}
                      </span>
                      {l.category && <Badge variant="secondary">{l.category}</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {l.location && <span>{l.location} • </span>}
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
