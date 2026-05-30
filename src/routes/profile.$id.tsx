import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Briefcase, Languages, Phone, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton, ErrorState, EmptyState } from "@/components/ui/states";
import type { Profile } from "@/lib/auth";

export const Route = createFileRoute("/profile/$id")({
  head: () => ({ meta: [{ title: "Profile — Marburg Connect" }] }),
  component: ProfileViewPage,
});

function ProfileViewPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <div className="container mx-auto p-6"><ErrorState error={error} onRetry={refetch} /></div>;
  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState title="Profile not found" description="This profile doesn't exist or has been removed." />
      </div>
    );
  }

  const initials = data.full_name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() ?? "U";
  const isMe = user?.id === data.id;
  const languages = Array.isArray(data.languages) ? data.languages : [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-2xl border bg-card p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar className="h-28 w-28">
            <AvatarImage src={data.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl font-bold">{data.full_name ?? "Unnamed"}</h1>
                {data.designation && <p className="text-muted-foreground">{data.designation}</p>}
              </div>
              {isMe && (
                <Button asChild variant="outline">
                  <Link to="/profile/edit"><Pencil className="mr-2 h-4 w-4" /> Edit profile</Link>
                </Button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {data.nationality && (
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {data.nationality}</span>
              )}
              {data.designation && (
                <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {data.designation}</span>
              )}
              {isMe && user?.email && (
                <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {user.email}</span>
              )}
              {data.phone && isMe && (
                <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {data.phone}</span>
              )}
            </div>
          </div>
        </div>

        {data.bio && (
          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold">About</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{data.bio}</p>
          </div>
        )}
        {data.hobbies && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold">Hobbies & interests</h2>
            <p className="mt-2 text-sm text-foreground/80">{data.hobbies}</p>
          </div>
        )}
        {languages.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold inline-flex items-center gap-2">
              <Languages className="h-5 w-5" /> Languages
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {languages.map((l) => <Badge key={l} variant="secondary">{l}</Badge>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
