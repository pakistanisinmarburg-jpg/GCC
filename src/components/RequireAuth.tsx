import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageSkeleton } from "@/components/ui/states";

export function RequireAuth({ children, role }: { children: React.ReactNode; role?: "admin" | "moderator" }) {
  const { user, loading, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    if (role === "admin" && !isAdmin) navigate({ to: "/dashboard" });
    if (role === "moderator" && !isModerator) navigate({ to: "/dashboard" });
  }, [loading, user, isAdmin, isModerator, role, navigate]);

  if (loading || !user) return <PageSkeleton />;
  if (role === "admin" && !isAdmin) return <PageSkeleton />;
  if (role === "moderator" && !isModerator) return <PageSkeleton />;
  return <>{children}</>;
}
