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

export const Route = createFileRoute("/accommodation/new")({
  component: () => <RequireAuth><NewAccommodation /></RequireAuth>,
});

const schema = z.object({
  title: z.string().min(3).max(120),
  type: z.string().min(1),
  rent: z.coerce.number().min(0),
  deposit: z.coerce.number().min(0).optional(),
  rooms: z.coerce.number().min(0).optional(),
  address: z.string().min(3),
  description: z.string().min(10),
});

function NewAccommodation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const f = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    setSaving(true);
    const { data, error } = await supabase
      .from("accommodations")
      .insert({ ...v, owner_id: user!.id, is_active: true })
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Posted");
    navigate({ to: "/accommodation/$id", params: { id: data.id } });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader><CardTitle>New accommodation</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={f.handleSubmit(onSubmit)} className="space-y-4">
            <div><Label>Title *</Label><Input {...f.register("title")} /></div>
            <div className="grid gap-4 md:grid-cols-3">
              <div><Label>Type *</Label><Input placeholder="Room/Apartment/Shared" {...f.register("type")} /></div>
              <div><Label>Rent (€) *</Label><Input type="number" {...f.register("rent")} /></div>
              <div><Label>Rooms</Label><Input type="number" {...f.register("rooms")} /></div>
            </div>
            <div><Label>Address *</Label><Input {...f.register("address")} /></div>
            <div><Label>Description *</Label><Textarea rows={5} {...f.register("description")} /></div>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
