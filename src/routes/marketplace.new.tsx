import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
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

export const Route = createFileRoute("/marketplace/new")({
  head: () => ({ meta: [{ title: "New listing — Marburg Connect" }] }),
  component: () => <RequireAuth><NewListing /></RequireAuth>,
});

const CATEGORIES = ["Furniture", "Electronics", "Books", "Clothing", "Bikes", "Kitchen", "Free", "Other"];
const CONDITIONS = ["New", "Like new", "Good", "Fair", "For parts"];

const schema = z.object({
  title: z.string().min(3).max(120),
  category: z.string().min(1),
  price: z.coerce.number().min(0).max(100000),
  condition: z.string().min(1),
  location: z.string().max(120).optional().or(z.literal("")),
  description: z.string().min(10).max(2000),
});

function NewListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length + files.length > 5) return toast.error("Max 5 images");
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const f of Array.from(files)) {
        uploaded.push(await uploadImage("marketplace-images", f));
      }
      setImages([...images, ...uploaded]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const onSubmit = async (v: z.infer<typeof schema>) => {
    if (images.length === 0) return toast.error("Add at least one image");
    setSaving(true);
    const { data, error } = await supabase
      .from("marketplace_listings")
      .insert({
        title: v.title,
        category: v.category,
        price: v.price,
        condition: v.condition,
        location: v.location || null,
        description: v.description,
        main_image: images[0],
        seller_id: user!.id,
        is_active: true,
        status: "active",
      })
      .select("id")
      .single();
    if (error) { setSaving(false); return toast.error(error.message); }
    if (images.length > 0) {
      await supabase.from("marketplace_images").insert(
        images.map((url) => ({ listing_id: data.id, image_url: url })),
      );
    }
    setSaving(false);
    toast.success("Listing created");
    navigate({ to: "/marketplace/$id", params: { id: data.id } });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader><CardTitle className="font-display text-2xl">New listing</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Images * (up to 5)</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {images.map((u, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded-md border">
                    <img src={u} className="h-full w-full object-cover" alt="" />
                    <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 rounded-full bg-background/80 p-1"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onUpload(e.target.files)} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || images.length >= 5}
                  className="grid h-20 w-20 place-items-center rounded-md border border-dashed text-muted-foreground hover:bg-card">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div><Label>Title *</Label><Input {...form.register("title")} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Category *</Label>
                <Select value={form.watch("category") || ""} onValueChange={(v) => form.setValue("category", v, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition *</Label>
                <Select value={form.watch("condition") || ""} onValueChange={(v) => form.setValue("condition", v, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Price (€) *</Label><Input type="number" min="0" step="1" {...form.register("price")} /></div>
              <div><Label>Location</Label><Input {...form.register("location")} placeholder="Marburg-Mitte, etc." /></div>
            </div>
            <div><Label>Description *</Label><Textarea rows={5} {...form.register("description")} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate({ to: "/marketplace" })}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
