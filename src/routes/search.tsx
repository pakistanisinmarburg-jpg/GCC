import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — Marburg Connect" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("communities");

  const { data } = useQuery({
    queryKey: ["search", tab, q],
    queryFn: async () => {
      if (!q) return [];
      const f = `%${q}%`;
      if (tab === "communities") return (await supabase.from("communities").select("id,name,description").ilike("name", f).limit(20)).data ?? [];
      if (tab === "marketplace") return (await supabase.from("marketplace_listings").select("id,title,price").ilike("title", f).limit(20)).data ?? [];
      if (tab === "jobs") return (await supabase.from("jobs").select("id,position,company").ilike("position", f).limit(20)).data ?? [];
      if (tab === "qa") return (await supabase.from("questions").select("id,title").ilike("title", f).limit(20)).data ?? [];
      if (tab === "users") return (await supabase.from("profiles").select("id,full_name").ilike("full_name", f).limit(20)).data ?? [];
      return [];
    },
    enabled: q.length > 1,
  });

  const linkFor = (item: any) => {
    if (tab === "communities") return <Link to="/communities/$id" params={{ id: item.id }}>{item.name}</Link>;
    if (tab === "marketplace") return <Link to="/marketplace/$id" params={{ id: item.id }}>{item.title}</Link>;
    if (tab === "jobs") return <Link to="/jobs/$id" params={{ id: item.id }}>{item.position} — {item.company}</Link>;
    if (tab === "qa") return <Link to="/qa/$id" params={{ id: item.id }}>{item.title}</Link>;
    if (tab === "users") return <Link to="/profile/$id" params={{ id: item.id }}>{item.full_name}</Link>;
    return null;
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Search</h1>
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Marburg Connect..." className="pl-9" autoFocus />
      </div>
      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {q.length < 2 ? <p className="text-sm text-muted-foreground">Type at least 2 characters…</p> :
            !data || data.length === 0 ? <EmptyState title="No results" /> :
            <div className="space-y-2">
              {data.map((item: any) => (
                <Card key={item.id}><CardContent className="p-4">{linkFor(item)}</CardContent></Card>
              ))}
            </div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
