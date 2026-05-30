import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/jobs/new")({
  component: () => <RequireAuth><NewJob /></RequireAuth>,
});

const schema = z.object({
  position: z.string().min(2),
  company: z.string().min(2),
  location: z.string().min(2),
  job_type: z.string().min(1),
  salary_range: z.string().optional().or(z.literal("")),
  description: z.string().min(10),
  requirements: z.string().optional().or(z.literal("")),
});

function NewJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const f = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    setSaving(true);
    const { data, error } = await supabase.from("jobs").insert({ ...v, posted_by: user!.id, is_active: true }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Posted");
    navigate({ to: "/jobs/$id", params: { id: data.id } });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader><CardTitle>Post a job</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={f.handleSubmit(onSubmit)} className="space-y-4">
            <div><Label>Position *</Label><Input {...f.register("position")} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Company *</Label><Input {...f.register("company")} /></div>
              <div><Label>Location *</Label><Input {...f.register("location")} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Type *</Label><Input placeholder="Full-time, Part-time, Remote, Internship" {...f.register("job_type")} /></div>
              <div><Label>Salary range</Label><Input {...f.register("salary_range")} /></div>
            </div>
            <div><Label>Description *</Label><Textarea rows={5} {...f.register("description")} /></div>
            <div><Label>Requirements</Label><Textarea rows={4} {...f.register("requirements")} /></div>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
