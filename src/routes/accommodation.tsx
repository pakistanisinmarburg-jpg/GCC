import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Home, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardSkeleton, EmptyState } from "@/components/ui/states";

export const Route = createFileRoute("/accommodation")({
  head: () => ({ meta: [{ title: "Accommodation — Marburg Connect" }] }),
  component: AccommodationList,
});

const TYPES = ["All", "Room", "Apartment", "Shared", "Studio", "House"];
const SORTS = [
  { v: "newest", l: "Newest" },
  { v: "price_asc", l: "Price: Low to High" },
  { v: "price_desc", l: "Price: High to Low" },
];

function AccommodationList() {
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("newest");

  const { data, isLoading } = useQuery({
    queryKey: ["accommodations", type, sort],
    queryFn: async () => {
      let q = supabase.from("accommodations").select("*").eq("is_active", true);
      if (type !== "All") q = q.eq("type", type);
      if (sort === "price_asc") q = q.order("rent", { ascending: true });
      else if (sort === "price_desc") q = q.order("rent", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      const { data } = await q;
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Accommodation</h1>
          <p className="mt-1 text-muted-foreground">Rooms, apartments and shared flats in Marburg.</p>
        </div>
        <Button asChild>
          <Link to="/accommodation/new"><Plus className="mr-2 h-4 w-4" />Post listing</Link>
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:max-w-md">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>{SORTS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? <CardSkeleton /> :
        !data || data.length === 0 ? <EmptyState title="No listings yet" icon={<Home className="h-10 w-10" />} /> :
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((a: any) => (
            <Link key={a.id} to="/accommodation/$id" params={{ id: a.id }}>
              <Card className="h-full overflow-hidden">
                <div className="aspect-video bg-muted">
                  {a.main_image && <img src={a.main_image} className="h-full w-full object-cover" alt="" />}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-primary font-bold">€{a.rent}/mo</p>
                  <p className="text-xs text-muted-foreground">{a.address}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>}
    </div>
  );
}
