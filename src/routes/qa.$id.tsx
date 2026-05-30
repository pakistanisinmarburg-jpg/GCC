import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PageSkeleton, EmptyState } from "@/components/ui/states";

export const Route = createFileRoute("/qa/$id")({ component: QuestionDetail });

function QuestionDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["question", id],
    queryFn: async () => (await supabase.from("questions").select("*").eq("id", id).maybeSingle()).data,
  });
  const answers = useQuery({
    queryKey: ["answers", id],
    queryFn: async () => (await supabase.from("answers").select("*").eq("question_id", id).order("created_at", { ascending: true })).data ?? [],
  });

  const submit = async () => {
    if (!user) return toast.error("Sign in first");
    if (!answer.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("answers").insert({ question_id: id, author_id: user.id, content: answer });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Posted");
    setAnswer("");
    qc.invalidateQueries({ queryKey: ["answers", id] });
  };

  if (q.isLoading) return <PageSkeleton />;
  if (!q.data) return <div className="container mx-auto p-6"><EmptyState title="Not found" /></div>;
  const qd = q.data as any;
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">{qd.title}</h1>
      <p className="mt-3 whitespace-pre-wrap text-foreground/80">{qd.description}</p>
      <h2 className="mt-10 font-display text-xl font-semibold">{answers.data?.length ?? 0} Answers</h2>
      <div className="mt-4 space-y-3">
        {(answers.data ?? []).map((a: any) => (
          <Card key={a.id}><CardContent className="p-4 text-sm whitespace-pre-wrap">{a.content}</CardContent></Card>
        ))}
      </div>
      {user && (
        <div className="mt-8">
          <Textarea rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write an answer..." />
          <Button onClick={submit} disabled={saving} className="mt-2">Post answer</Button>
        </div>
      )}
    </div>
  );
}
