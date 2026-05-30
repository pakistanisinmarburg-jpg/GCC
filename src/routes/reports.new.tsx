import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/reports/new")({
  head: () => ({ meta: [{ title: "Report — Marburg Connect" }] }),
  component: () => <RequireAuth><NewReport /></RequireAuth>,
});

const TYPES = ["Workplace", "Housing", "Public Space", "Education", "Online", "Other"];
const schema = z.object({
  incident_type: z.string().min(1),
  incident_date: z.string().optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  description: z.string().min(20),
  perpetrator_description: z.string().optional().or(z.literal("")),
  anonymous: z.boolean(),
});

function NewReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const f = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { anonymous: false } });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    setSaving(true);
    const { data, error } = await supabase.from("reports").insert({
      user_id: user!.id,
      incident_type: v.incident_type,
      incident_date: v.incident_date || null,
      location: v.location || null,
      description: v.description,
      perpetrator_description: v.perpetrator_description || null,
      anonymous: v.anonymous,
      status: "submitted",
    }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Report submitted");
    navigate({ to: "/reports/$id", params: { id: data.id } });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Report discrimination</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Your report is confidential and only visible to you and moderators.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={f.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Incident type *</Label>
              <Select value={f.watch("incident_type") || ""} onValueChange={(v) => f.setValue("incident_type", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Date of incident</Label><Input type="date" {...f.register("incident_date")} /></div>
              <div><Label>Location / context</Label><Input {...f.register("location")} /></div>
            </div>
            <div><Label>Description *</Label><Textarea rows={5} {...f.register("description")} /></div>
            <div><Label>Perpetrator description</Label><Textarea rows={3} {...f.register("perpetrator_description")} /></div>
            <label className="flex items-center gap-3">
              <Switch checked={f.watch("anonymous")} onCheckedChange={(c) => f.setValue("anonymous", c)} />
              <span className="text-sm">Submit anonymously</span>
            </label>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit report</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
