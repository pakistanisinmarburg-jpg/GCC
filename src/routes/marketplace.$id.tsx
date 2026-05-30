import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Tag, MessageCircle, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageSkeleton, EmptyState } from "@/components/ui/states";

export const Route = createFileRoute("/marketplace/$id")({
  head: () => ({ meta: [{ title: "Listing — Marburg Connect" }] }),
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeImg, setActiveImg] = useState(0);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*, seller:profiles!marketplace_listings_seller_id_fkey(id,full_name,avatar_url), images:marketplace_images(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (!data) return <div className="container mx-auto p-6"><EmptyState title="Listing not found" /></div>;

  const images: { id: string; image_url: string }[] = data.images?.length
    ? data.images
    : data.main_image ? [{ id: "m", image_url: data.main_image }] : [];
  const isOwner = user?.id === data.seller_id;

  const sendMessage = async () => {
    if (!user) return toast.error("Sign in to contact seller");
    if (!msg.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: data.seller_id,
      listing_id: id,
      content: msg,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Message sent");
    setMsg(""); setMsgOpen(false);
  };

  const markSold = async () => {
    const { error } = await supabase.from("marketplace_listings").update({ status: "sold", is_active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked as sold");
    qc.invalidateQueries({ queryKey: ["listing", id] });
  };

  const remove = async () => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    navigate({ to: "/marketplace" });
  };

  return (
    <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="aspect-square w-full overflow-hidden rounded-2xl bg-muted">
          {images.length > 0 ? <img src={images[activeImg].image_url} alt="" className="h-full w-full object-cover" /> :
            <div className="grid h-full place-items-center text-muted-foreground">No image</div>}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((im, i) => (
              <button key={im.id} onClick={() => setActiveImg(i)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 ${i === activeImg ? "border-primary" : "border-transparent"}`}>
                <img src={im.image_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-bold">{data.title}</h1>
          {data.status === "sold" && <Badge variant="destructive">Sold</Badge>}
        </div>
        <div className="mt-2 font-display text-3xl font-bold text-primary">
          {data.price != null ? `€${Number(data.price).toLocaleString()}` : "Free"}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
          {data.category && <span className="inline-flex items-center gap-1"><Tag className="h-4 w-4" /> {data.category}</span>}
          {data.condition && <Badge variant="secondary">{data.condition}</Badge>}
          {data.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {data.location}</span>}
        </div>
        {data.description && <p className="mt-6 whitespace-pre-wrap text-foreground/80">{data.description}</p>}

        {data.seller && (
          <Link to="/profile/$id" params={{ id: data.seller.id }}>
            <Card className="mt-6"><CardContent className="flex items-center gap-3 p-4">
              <Avatar><AvatarImage src={data.seller.avatar_url} /><AvatarFallback>S</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="font-medium">{data.seller.full_name}</div>
                <div className="text-xs text-muted-foreground">View profile</div>
              </div>
            </CardContent></Card>
          </Link>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {!isOwner && data.status !== "sold" && (
            <Button onClick={() => setMsgOpen(true)}><MessageCircle className="mr-2 h-4 w-4" /> Contact seller</Button>
          )}
          {isOwner && data.status !== "sold" && (
            <Button variant="outline" onClick={markSold}><CheckCircle2 className="mr-2 h-4 w-4" /> Mark as sold</Button>
          )}
          {isOwner && (
            <Button variant="destructive" onClick={remove}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
          )}
        </div>
      </div>

      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Message seller</DialogTitle></DialogHeader>
          <Textarea rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Hi! Is this still available?" />
          <DialogFooter>
            <Button onClick={sendMessage} disabled={sending}>{sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
