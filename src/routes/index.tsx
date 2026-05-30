import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Users,
  ShoppingBag,
  Home,
  Briefcase,
  MessageSquareQuote,
  Shield,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marburg Connect — Home for Marburg's international community" },
      {
        name: "description",
        content:
          "Communities, marketplace, accommodation, jobs and Q&A for international residents, students, professionals and families in Marburg, Germany.",
      },
      { property: "og:title", content: "Marburg Connect" },
      {
        property: "og:description",
        content: "A digital home for Marburg's international community.",
      },
    ],
  }),
  component: LandingPage,
});

interface SliderImage {
  id: string;
  image_url: string;
  title?: string | null;
  subtitle?: string | null;
  sort_order: number;
  is_active: boolean;
}

interface PlatformSetting {
  key: string;
  value: string | null;
}

function useSettings(keys: string[]) {
  return useQuery({
    queryKey: ["platform_settings", keys.sort().join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key,value")
        .in("key", keys);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as PlatformSetting[] | null)?.forEach((r) => {
        if (r.value != null) map[r.key] = r.value;
      });
      return map;
    },
  });
}

function HeroSlider() {
  const { data: settings } = useSettings(["hero_title", "hero_subtitle"]);
  const { data: slides } = useQuery({
    queryKey: ["slider_images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slider_images")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SliderImage[];
    },
  });

  const [idx, setIdx] = useState(0);
  const total = slides?.length ?? 0;

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  const title = settings?.hero_title ?? "Your home in Marburg starts here";
  const subtitle =
    settings?.hero_subtitle ??
    "Find communities, housing, jobs and answers — all in one place, built for Marburg's international residents.";

  return (
    <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden bg-foreground text-background">
      {total > 0 ? (
        slides!.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === idx ? 1 : 0 }}
          >
            <img src={s.image_url} alt={s.title ?? ""} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          </div>
        ))
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-foreground to-foreground" />
      )}

      <div className="container relative mx-auto flex h-full flex-col items-start justify-center px-4">
        <div className="max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-foreground ring-1 ring-primary/40">
            Marburg • International community
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            {slides?.[idx]?.title || title}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-background/80">
            {slides?.[idx]?.subtitle || subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/auth/register">
                Sign up <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Link to="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + total) % total)}
            className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20 md:block"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % total)}
            className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20 md:block"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {slides!.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-white" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function StatsStrip() {
  const { data } = useQuery({
    queryKey: ["landing_stats"],
    queryFn: async () => {
      const [u, m, l, j] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("community_members").select("*", { count: "exact", head: true }),
        supabase.from("marketplace_listings").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }),
      ]);
      return {
        users: u.count ?? 0,
        members: m.count ?? 0,
        listings: l.count ?? 0,
        jobs: j.count ?? 0,
      };
    },
  });

  const items = [
    { label: "Users", value: data?.users ?? 0, icon: Users },
    { label: "Community members", value: data?.members ?? 0, icon: MessageSquareQuote },
    { label: "Listings", value: data?.listings ?? 0, icon: ShoppingBag },
    { label: "Open jobs", value: data?.jobs ?? 0, icon: Briefcase },
  ];

  return (
    <section className="border-y bg-card/40 py-10">
      <div className="container mx-auto grid grid-cols-2 gap-6 px-4 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <it.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold">{it.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{it.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Users, title: "Communities", desc: "Join interest-based groups and meet people who share your background, language or hobbies." },
  { icon: ShoppingBag, title: "Marketplace", desc: "Buy and sell second-hand items safely within Marburg's trusted network." },
  { icon: Home, title: "Accommodation", desc: "Find rooms, shared flats and apartments from verified members." },
  { icon: Briefcase, title: "Jobs", desc: "Discover part-time, full-time and internship opportunities for internationals." },
  { icon: MessageSquareQuote, title: "Q&A", desc: "Ask anything about life in Marburg — bureaucracy, university, daily living." },
  { icon: Shield, title: "Report discrimination", desc: "A confidential channel to report incidents and get support." },
];

function Features() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Everything you need, in one place</h2>
        <p className="mt-3 text-muted-foreground">
          Marburg Connect brings the essentials of international life under one roof.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="border-border/60 transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

interface CommunityPost {
  id: string;
  title?: string | null;
  content: string;
  created_at: string;
  community_id: string;
  author_id?: string | null;
}

function LatestPosts() {
  const { data } = useQuery({
    queryKey: ["latest_community_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as CommunityPost[];
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="bg-card/40 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">Latest from communities</h2>
            <p className="mt-1 text-muted-foreground">Fresh conversations from across Marburg Connect.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/communities">Browse communities</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {data.map((p) => (
            <Link
              key={p.id}
              to="/communities/$id"
              params={{ id: p.community_id }}
              className="group rounded-xl border bg-background p-6 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="text-xs text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString()}
              </div>
              <h3 className="mt-2 line-clamp-2 font-display text-lg font-semibold group-hover:text-primary">
                {p.title || p.content.slice(0, 60)}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.content}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const { data } = useSettings(["about_text"]);
  const text =
    data?.about_text ??
    "Marburg Connect is a community-built platform that helps internationals settle, thrive and belong in Marburg. From your first night in a shared flat to landing your first job — we're with you.";
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Built for Marburg's international community</h2>
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 text-primary-foreground md:p-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to join Marburg Connect?</h2>
          <p className="mt-3 text-primary-foreground/85">
            Create your account in seconds. It's free, and it's built by people who live here too.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth/register">Create account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Link to="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
  return (
    <div>
      <HeroSlider />
      <StatsStrip />
      <AboutSection />
      <Features />
      <LatestPosts />
      <CTA />
    </div>
  );
}
