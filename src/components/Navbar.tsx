import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Bell, Menu, Search, Shield, LogOut, User as UserIcon, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/communities", label: "Communities" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/accommodation", label: "Accommodation" },
  { to: "/jobs", label: "Jobs" },
  { to: "/qa", label: "Q&A" },
] as const;

function NavLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {NAV_LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={onClick}
          className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          activeProps={{ className: "text-primary font-semibold" }}
          activeOptions={{ exact: l.to === "/" }}
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let active = true;
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (active) setUnread(count ?? 0);
    };
    load();
    const ch = supabase
      .channel(`nav-notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        load,
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  const initials = profile?.full_name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Logo />

          <nav className="hidden items-center gap-6 md:flex">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/search" })} aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate({ to: "/notifications" })}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-xs">
                    {unread > 9 ? "9+" : unread}
                  </Badge>
                )}
              </Button>

              {isAdmin && (
                <Button
                  className="hidden bg-accent text-accent-foreground hover:bg-accent/90 md:inline-flex"
                  size="sm"
                  onClick={() => navigate({ to: "/admin" })}
                >
                  <Shield className="mr-2 h-4 w-4" /> Admin
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{profile?.full_name ?? user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile/$id", params: { id: user.id } })}>
                    <UserIcon className="mr-2 h-4 w-4" /> My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile/edit" })}>
                    <Settings className="mr-2 h-4 w-4" /> Edit profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                      <Shield className="mr-2 h-4 w-4" /> Admin panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" onClick={() => navigate({ to: "/auth/login" })}>
                Sign in
              </Button>
              <Button onClick={() => navigate({ to: "/auth/register" })}>Sign up</Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-4">
                <NavLinks onClick={() => setOpen(false)} />
                {!user && (
                  <div className="mt-4 flex flex-col gap-2">
                    <Button variant="outline" onClick={() => { setOpen(false); navigate({ to: "/auth/login" }); }}>
                      Sign in
                    </Button>
                    <Button onClick={() => { setOpen(false); navigate({ to: "/auth/register" }); }}>
                      Sign up
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
