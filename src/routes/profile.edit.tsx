import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth, type Profile } from "@/lib/auth";
import { uploadImage } from "@/lib/storage";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({ meta: [{ title: "Edit profile — Marburg Connect" }] }),
  component: () => <RequireAuth><EditProfile /></RequireAuth>,
});

const NATIONALITIES = [
  "German","Indian","Chinese","Syrian","Turkish","Iranian","Pakistani","Nigerian","Brazilian","Ukrainian","Polish","Italian","Spanish","French","American","British","Russian","Vietnamese","Indonesian","Egyptian","Moroccan","Other",
];

const schema = z.object({
  full_name: z.string().min(2).max(100),
  nationality: z.string().optional().or(z.literal("")),
  designation: z.string().max(120).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  hobbies: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});

function EditProfile() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [langs, setLangs] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["profile", user!.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return (data as Profile | null) ?? null;
    },
  });

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) {
      form.reset({
        full_name: data.full_name ?? "",
        nationality: data.nationality ?? "",
        designation: data.designation ?? "",
        bio: data.bio ?? "",
        hobbies: data.hobbies ?? "",
        phone: data.phone ?? "",
      });
      setAvatarUrl(data.avatar_url ?? null);
      setLangs(Array.isArray(data.languages) ? data.languages : []);
    }
  }, [data, form]);

  const onUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage("profile-images", file, user!.id);
      setAvatarUrl(url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addLang = () => {
    const v = langInput.trim();
    if (v && !langs.includes(v)) setLangs([...langs, v]);
    setLangInput("");
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSaving(true);
    const payload = {
      full_name: values.full_name,
      nationality: values.nationality || null,
      designation: values.designation || null,
      bio: values.bio || null,
      hobbies: values.hobbies || null,
      phone: values.phone || null,
      avatar_url: avatarUrl,
      languages: langs,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    await refresh();
    qc.invalidateQueries({ queryKey: ["profile", user!.id] });
    navigate({ to: "/profile/$id", params: { id: user!.id } });
  };

  if (isLoading) return <div className="container mx-auto p-6">Loading…</div>;

  const initials = form.watch("full_name")?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader><CardTitle className="font-display text-2xl">Edit profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onUpload(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {avatarUrl ? "Change photo" : "Upload photo"}
              </Button>
            </div>

            <div>
              <Label>Full name *</Label>
              <Input {...form.register("full_name")} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Nationality</Label>
                <Select
                  value={form.watch("nationality") || ""}
                  onValueChange={(v) => form.setValue("nationality", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Designation</Label>
                <Input {...form.register("designation")} placeholder="Student, Engineer, etc." />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...form.register("phone")} placeholder="+49…" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea rows={4} {...form.register("bio")} placeholder="Tell others about yourself" />
            </div>
            <div>
              <Label>Hobbies & interests</Label>
              <Textarea rows={2} {...form.register("hobbies")} />
            </div>
            <div>
              <Label>Languages</Label>
              <div className="flex gap-2">
                <Input
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLang(); } }}
                  placeholder="Add a language and press Enter"
                />
                <Button type="button" variant="outline" onClick={addLang}>Add</Button>
              </div>
              {langs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {langs.map((l) => (
                    <Badge key={l} variant="secondary" className="gap-1">
                      {l}
                      <button type="button" onClick={() => setLangs(langs.filter((x) => x !== l))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => navigate({ to: "/profile/$id", params: { id: user!.id } })}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
