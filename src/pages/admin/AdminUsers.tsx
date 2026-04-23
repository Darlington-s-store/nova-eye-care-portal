import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, ShieldCheck } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type RoleRow = { user_id: string; role: string };

const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      setUsers((profiles as Profile[]) ?? []);
      const map: Record<string, string[]> = {};
      ((roleRows as RoleRow[]) ?? []).forEach((r) => {
        map[r.user_id] = [...(map[r.user_id] ?? []), r.role];
      });
      setRoles(map);
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter((u) =>
    !q || `${u.full_name ?? ""} ${u.email ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AdminLayout title="Users" subtitle="Registered patients and admins.">
      <Card className="p-4 shadow-card mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users..." className="pl-9" />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const userRoles = roles[u.id] ?? [];
                const isAdmin = userRoles.includes("admin");
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-sm">{u.email || "—"}</TableCell>
                    <TableCell className="text-sm">{u.phone || "—"}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Badge className="bg-primary text-primary-foreground"><ShieldCheck className="h-3 w-3 mr-1" /> Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-GB")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </AdminLayout>
  );
};

export default AdminUsers;
