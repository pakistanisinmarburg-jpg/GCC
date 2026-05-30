import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardSkeleton, EmptyState } from "@/components/ui/states";

export const Route = createFileRoute("/jobs")({
  head: () => ({ meta: [{ title: "Jobs — Marburg Connect" }] }),
  component: JobsList,
});

const TYPES = ["All", "Full-time", "Part-time", "Internship", "Mini-job", "Freelance", "Working student"];

function JobsList() {
  const [type, setType] = useState("All");
  const { data, isLoading } = useQuery({
    queryKey: ["jobs", type],
    queryFn: async () => {
      let q = supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (type !== "All") q = q.eq("job_type", type);
      return (await q).data ?? [];
    },
  });
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Jobs</h1>
          <p className="mt-1 text-muted-foreground">Opportunities for internationals in and around Marburg.</p>
        </div>
        <Button asChild>
          <Link to="/jobs/new"><Plus className="mr-2 h-4 w-4" />Post a job</Link>
        </Button>
      </div>

      <div className="mb-6 max-w-xs">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="Job type" /></SelectTrigger>
          <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? <CardSkeleton /> :
        !data || data.length === 0 ? <EmptyState title="No openings yet" icon={<Briefcase className="h-10 w-10" />} /> :
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((j: any) => (
            <Link key={j.id} to="/jobs/$id" params={{ id: j.id }}>
              <Card className="h-full"><CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{j.position}</h3>
                    <p className="text-sm text-muted-foreground">{j.company} • {j.location}</p>
                  </div>
                  {j.job_type && <Badge>{j.job_type}</Badge>}
                </div>
                {j.salary_range && <p className="mt-2 text-sm text-primary font-medium">{j.salary_range}</p>}
              </CardContent></Card>
            </Link>
          ))}
        </div>}
    </div>
  );
}
