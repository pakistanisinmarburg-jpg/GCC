import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquareQuote, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardSkeleton, EmptyState } from "@/components/ui/states";

export const Route = createFileRoute("/qa")({
  head: () => ({ meta: [{ title: "Q&A — Marburg Connect" }] }),
  component: QAList,
});

const CATEGORIES = ["All", "Visa", "Housing", "Studies", "Work", "Healthcare", "Bureaucracy", "Daily life", "Language", "Other"];

function QAList() {
  const [cat, setCat] = useState("All");
  const { data, isLoading } = useQuery({
    queryKey: ["questions", cat],
    queryFn: async () => {
      let q = supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (cat !== "All") q = q.eq("category", cat);
      return (await q).data ?? [];
    },
  });
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Q&A</h1>
          <p className="mt-1 text-muted-foreground">Ask the community anything about life in Marburg.</p>
        </div>
        <Button asChild>
          <Link to="/qa/new"><Plus className="mr-2 h-4 w-4" />Ask a question</Link>
        </Button>
      </div>

      <div className="mb-6 max-w-xs">
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? <CardSkeleton count={4} /> :
        !data || data.length === 0 ? <EmptyState title="No questions yet" icon={<MessageSquareQuote className="h-10 w-10" />} /> :
        <div className="space-y-3">
          {data.map((q: any) => (
            <Link key={q.id} to="/qa/$id" params={{ id: q.id }}>
              <Card><CardContent className="p-5">
                <h3 className="font-display text-lg font-semibold">{q.title}</h3>
                {q.category && <span className="mt-1 inline-block rounded bg-secondary px-2 py-0.5 text-xs">{q.category}</span>}
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{q.description}</p>
              </CardContent></Card>
            </Link>
          ))}
        </div>}
    </div>
  );
}
