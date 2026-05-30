import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { uploadImage } from "@/lib/storage";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/communities/new")({
  head: () => ({ meta: [{ title: "New community — Marburg Connect" }] }),
  component: () => <RequireAuth><NewCommunity /></RequireAuth>,
});

const CATEGORIES = ["Cultural", "Language", "Hobby", "Professional", "Religious", "Student", "Support", "Sports", "Other"];

const schema = z.object({
  name: z.string().min(2).max(80),
  category: z.string().min(1),
  description: z.string().min(10).max(1000),
  rules: z.string().max(2000).optional().or(z.literal("")),
});

function NewCommunity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage("community-covers", file);
      setCover(url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const onSubmit = async (v: z.infer<typeof schema>) => {
    setSaving(true);
    const { data, error } = await supabase
      .from("communities")
      .insert({
        name: v.name,
        category: v.category,
        description: v.description,
        rules: v.rules || null,
        cover_image: cover,
        created_by: user!.id,
      })
      .select("id")
      .single();
    if (error) { setSaving(false); return toast.error(error.message); }
    await supabase.from("community_members").insert({ community_id: data.id, user_id: user!.id, role: "admin" });
    setSaving(false);
    toast.success("Community created");
    navigate({ to: "/communities/$id", params: { id: data.id } });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader><CardTitle className="font-display text-2xl">Create a community</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Cover image</Label>
              <div className="mt-1 flex items-center gap-3">
                {cover && <img src={cover} className="h-16 w-28 rounded-md object-cover" alt="" />}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {cover ? "Replace" : "Upload"}
                </Button>
              </div>
            </div>
            <div>
              <Label>Name *</Label><Input {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.watch("category") || ""} onValueChange={(v) => form.setValue("category", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea rows={4} {...form.register("description")} />
              {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
            </div>
            <div>
              <Label>Rules</Label>
              <Textarea rows={3} {...form.register("rules")} placeholder="Optional code of conduct" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate({ to: "/communities" })}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
