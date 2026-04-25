import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bell, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

type N = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

const AdminNotifications = () => {
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("notifications").select("*").eq("audience", "admin").order("created_at", { ascending: false }).limit(100);
    setItems((data as N[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel(`admin-notifs-${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: "audience=eq.admin" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
  };

  return (
    <AdminLayout title="Activity feed" subtitle="Everything happening on the site.">
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={markAllRead}><Check className="h-4 w-4" /> Mark all read</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground"><Bell className="h-8 w-8 mx-auto mb-3 opacity-50" /> No activity yet.</Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const inner = (
              <Card className={`p-4 hover:shadow-elegant transition-smooth ${!n.read ? "border-primary/40 bg-primary-soft/20" : ""}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{n.title}</p>
                      {!n.read && <Badge className="bg-primary text-primary-foreground text-[10px]">new</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
              </Card>
            );
            return n.link ? <Link key={n.id} to={n.link}>{inner}</Link> : <div key={n.id}>{inner}</div>;
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNotifications;
