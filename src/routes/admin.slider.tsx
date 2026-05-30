import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/slider")({ component: AdminSlider });

function AdminSlider() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");

  const { data } = useQuery({
    queryKey: ["admin_slider"],
    queryFn: async () => (await supabase.from("slider_images").select("*").order("sort_order", { ascending: true })).data ?? [],
  });

  const add = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage("slider-images", file);
      const order = ((data?.length ?? 0) + 1);
      const { error } = await supabase.from("slider_images").insert({ image_url: url, title: title || null, is_active: true, sort_order: order });
      if (error) throw error;
      toast.success("Slide added");
      setTitle("");
      qc.invalidateQueries({ queryKey: ["admin_slider"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setUploading(false); }
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("slider_images").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin_slider"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    await supabase.from("slider_images").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin_slider"] });
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Hero slider</h1>
      <Card className="mb-6"><CardContent className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 min-w-48"><Input placeholder="Optional title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => add(e.target.files?.[0])} />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Add slide
        </Button>
      </CardContent></Card>
      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((s: any) => (
          <Card key={s.id}><CardContent className="flex gap-3 p-3">
            <img src={s.image_url} className="h-20 w-32 rounded-md object-cover" alt="" />
            <div className="flex-1">
              <div className="text-sm font-medium">{s.title ?? "Untitled"}</div>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs"><Switch checked={s.is_active} onCheckedChange={(c) => toggle(s.id, c)} /> Active</label>
                <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
