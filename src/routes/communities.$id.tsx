import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Users, Calendar, Info, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";

export const Route = createFileRoute("/communities/$id")({
  head: () => ({ meta: [{ title: "Community — Marburg Connect" }] }),
  component: CommunityDetail,
});

function CommunityDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("about");

  const community = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("communities").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const membership = useQuery({
    queryKey: ["community_membership", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("community_members")
        .select("*")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const toggleMembership = async () => {
    if (!user) return toast.error("Sign in first");
    if (membership.data) {
      await supabase.from("community_members").delete().eq("community_id", id).eq("user_id", user.id);
      toast.success("Left community");
    } else {
      const { error } = await supabase.from("community_members").insert({ community_id: id, user_id: user.id, role: "member" });
      if (error) return toast.error(error.message);
      toast.success("Joined community");
    }
    qc.invalidateQueries({ queryKey: ["community_membership", id] });
  };

  if (community.isLoading) return <PageSkeleton />;
  if (community.error) return <div className="container mx-auto p-6"><ErrorState error={community.error} /></div>;
  if (!community.data) return <div className="container mx-auto p-6"><EmptyState title="Community not found" /></div>;

  const c = community.data;
  const isMember = !!membership.data;

  return (
    <div>
      <div className="relative h-56 w-full overflow-hidden bg-muted md:h-72">
        {c.cover_image ? (
          <img src={c.cover_image} alt={c.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>
      <div className="container mx-auto px-4">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-bold">{c.name}</h1>
              {c.category && <Badge variant="secondary">{c.category}</Badge>}
            </div>
            {c.description && <p className="mt-2 max-w-2xl text-muted-foreground">{c.description}</p>}
          </div>
          {user && (
            <Button onClick={toggleMembership} variant={isMember ? "outline" : "default"}>
              {isMember ? "Leave community" : "Join community"}
            </Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList>
            <TabsTrigger value="about"><Info className="mr-2 h-4 w-4" />About</TabsTrigger>
            <TabsTrigger value="discussions"><MessageSquare className="mr-2 h-4 w-4" />Discussions</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="mr-2 h-4 w-4" />Events</TabsTrigger>
            <TabsTrigger value="members"><Users className="mr-2 h-4 w-4" />Members</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <Card><CardContent className="prose max-w-none p-6">
              <h3 className="font-display text-lg font-semibold">Description</h3>
              <p className="text-foreground/80">{c.description || "No description yet."}</p>
              {c.rules && (<><h3 className="mt-6 font-display text-lg font-semibold">Rules</h3>
                <p className="whitespace-pre-wrap text-foreground/80">{c.rules}</p></>)}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="discussions" className="mt-6">
            <Discussions communityId={id} canPost={isMember} />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <Events communityId={id} />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Members communityId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Discussions({ communityId, canPost }: { communityId: string; canPost: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["community_posts", communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("community_id", communityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = async () => {
    if (!user) return toast.error("Sign in first");
    if (!content.trim()) return toast.error("Write something");
    setSaving(true);
    const { error } = await supabase.from("community_posts").insert({
      community_id: communityId,
      author_id: user.id,
      title: title || null,
      content,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Posted");
    setOpen(false); setTitle(""); setContent("");
    qc.invalidateQueries({ queryKey: ["community_posts", communityId] });
  };

  return (
    <div className="space-y-4">
      {canPost && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>New post</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New discussion post</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea rows={5} placeholder="What's on your mind?" value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        !data || data.length === 0 ? (
          <EmptyState title="No posts yet" description={canPost ? "Start the conversation." : "Join the community to post."} />
        ) : data.map((p) => (
          <Card key={p.id}><CardContent className="p-5">
            {p.title && <h3 className="font-display text-lg font-semibold">{p.title}</h3>}
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{p.content}</p>
            <p className="mt-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
          </CardContent></Card>
        ))}
    </div>
  );
}

function Events({ communityId }: { communityId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["community_events", communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_events")
        .select("*")
        .eq("community_id", communityId)
        .order("starts_at", { ascending: true });
      return data ?? [];
    },
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data || data.length === 0) return <EmptyState title="No events scheduled" />;
  return (
    <div className="space-y-3">
      {data.map((e) => (
        <Card key={e.id}><CardContent className="p-5">
          <h3 className="font-display text-lg font-semibold">{e.title}</h3>
          {e.starts_at && <p className="text-sm text-muted-foreground">{new Date(e.starts_at).toLocaleString()}</p>}
          {e.description && <p className="mt-2 text-sm">{e.description}</p>}
        </CardContent></Card>
      ))}
    </div>
  );
}

function Members({ communityId }: { communityId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["community_members_list", communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_members")
        .select("user_id, role, profiles:profiles!community_members_user_id_fkey(id,full_name,avatar_url)")
        .eq("community_id", communityId);
      return data ?? [];
    },
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data || data.length === 0) return <EmptyState title="No members yet" />;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {data.map((m: any) => (
        <Link key={m.user_id} to="/profile/$id" params={{ id: m.user_id }}>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <Avatar><AvatarImage src={m.profiles?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="font-medium">{m.profiles?.full_name ?? "Member"}</div>
              <div className="text-xs text-muted-foreground capitalize">{m.role}</div>
            </div>
          </CardContent></Card>
        </Link>
      ))}
    </div>
  );
}
