import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Star, Users, Clock, ArrowRight, Loader2 } from "lucide-react";

type Stats = {
  totalAppts: number;
  pendingAppts: number;
  todayAppts: number;
  pendingReviews: number;
  totalUsers: number;
};

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<{
    id: string;
    full_name: string;
    service: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
  }[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const [a, p, t, r, u, recentAppts] = await Promise.all([
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", today),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id, full_name, service, appointment_date, appointment_time, status").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        totalAppts: a.count ?? 0,
        pendingAppts: p.count ?? 0,
        todayAppts: t.count ?? 0,
        pendingReviews: r.count ?? 0,
        totalUsers: u.count ?? 0,
      });
      setRecent(recentAppts.data ?? []);
    })();
  }, []);

  const cards = [
    { label: "Total appointments", value: stats?.totalAppts, icon: CalendarDays, link: "/admin/appointments" },
    { label: "Pending requests", value: stats?.pendingAppts, icon: Clock, link: "/admin/appointments?status=pending" },
    { label: "Today's bookings", value: stats?.todayAppts, icon: CalendarDays, link: "/admin/appointments" },
    { label: "Reviews to approve", value: stats?.pendingReviews, icon: Star, link: "/admin/reviews" },
    { label: "Registered users", value: stats?.totalUsers, icon: Users, link: "/admin/users" },
  ];

  return (
    <AdminLayout title="Overview" subtitle="A quick look at clinic activity.">
      {!stats ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            {cards.map((c) => (
              <Link key={c.label} to={c.link}>
                <Card className="p-5 border hover:bg-muted/30 transition-colors h-full">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary border">
                      <c.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="p-5 md:p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Recent appointments</h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/appointments">View all <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No appointments yet.</p>
            ) : (
              <ul className="divide-y">
                {recent.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.service}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <p>{new Date(a.appointment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {a.appointment_time}</p>
                      <Badge variant="secondary" className="mt-1 capitalize">{a.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminOverview;
