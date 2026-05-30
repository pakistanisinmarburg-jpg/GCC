import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const KEYS = ["site_name", "hero_title", "hero_subtitle", "about_text", "contact_email"];

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["platform_settings_admin"],
    queryFn: async () => (await supabase.from("platform_settings").select("key,value").in("key", KEYS)).data ?? [],
  });

  useEffect(() => {
    if (data) {
      const m: Record<string, string> = {};
      (data as any[]).forEach((r) => { m[r.key] = r.value ?? ""; });
      setValues(m);
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    const rows = KEYS.map((k) => ({ key: k, value: values[k] ?? "" }));
    const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["platform_settings"] });
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Platform settings</h1>
      <Card><CardContent className="space-y-4 p-6">
        {KEYS.map((k) => (
          <div key={k}>
            <Label className="capitalize">{k.replace(/_/g, " ")}</Label>
            {k === "about_text" || k === "hero_subtitle" ? (
              <Textarea rows={3} value={values[k] ?? ""} onChange={(e) => setValues({ ...values, [k]: e.target.value })} />
            ) : (
              <Input value={values[k] ?? ""} onChange={(e) => setValues({ ...values, [k]: e.target.value })} />
            )}
          </div>
        ))}
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
      </CardContent></Card>
    </div>
  );
}
