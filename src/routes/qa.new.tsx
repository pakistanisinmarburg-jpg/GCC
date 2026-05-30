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

export const Route = createFileRoute("/qa/new")({
  component: () => <RequireAuth><NewQ /></RequireAuth>,
});

const schema = z.object({
  title: z.string().min(8).max(200),
  category: z.string().optional().or(z.literal("")),
  description: z.string().min(20),
});

function NewQ() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const f = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    setSaving(true);
    const { data, error } = await supabase.from("questions").insert({ ...v, author_id: user!.id }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Posted");
    navigate({ to: "/qa/$id", params: { id: data.id } });
  };
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader><CardTitle>Ask a question</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={f.handleSubmit(onSubmit)} className="space-y-4">
            <div><Label>Title *</Label><Input {...f.register("title")} /></div>
            <div><Label>Category</Label><Input {...f.register("category")} placeholder="Housing, Visa, University..." /></div>
            <div><Label>Details *</Label><Textarea rows={6} {...f.register("description")} /></div>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
