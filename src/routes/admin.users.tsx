import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/states";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,nationality,created_at,user_roles(role)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const changeRole = async (userId: string, role: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["admin_users"] });
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Users</h1>
      {isLoading ? <TableSkeleton /> : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Nationality</TableHead><TableHead>Joined</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name ?? "—"}</TableCell>
                  <TableCell>{u.nationality ?? "—"}</TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Select defaultValue={u.user_roles?.[0]?.role ?? "user"} onValueChange={(v) => changeRole(u.id, v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">user</SelectItem>
                        <SelectItem value="moderator">moderator</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
