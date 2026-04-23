import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { notifyUser } from "@/lib/notify";
import { toast } from "sonner";
import { Loader2, Search, CheckCircle2, X, Clock, Phone, Mail, Calendar } from "lucide-react";

type Appt = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  user_id: string | null;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  confirmed: "bg-primary-soft text-primary",
  cancelled: "bg-muted text-muted-foreground",
  completed: "bg-green-100 text-green-900",
};

const AdminAppointments = () => {
  const [items, setItems] = useState<Appt[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("appointments").select("*").order("appointment_date", { ascending: false });
    setItems((data as Appt[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-appts").on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const updateStatus = async (a: Appt, status: Appt["status"]) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    if (a.user_id) {
      const labels: Record<string, string> = {
        confirmed: "Your appointment has been confirmed",
        cancelled: "Your appointment was cancelled",
        completed: "Your appointment is marked as completed",
        pending: "Your appointment is pending review",
      };
      await notifyUser(a.user_id, {
        title: labels[status],
        body: `${a.service} on ${new Date(a.appointment_date).toLocaleDateString("en-GB")} at ${a.appointment_time}`,
        link: "/dashboard",
      });
    }
    toast.success(`Status updated to ${status}`);
  };

  const filtered = items.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (q && !`${a.full_name} ${a.email} ${a.phone} ${a.service}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout title="Appointments" subtitle="Confirm, complete, or cancel patient bookings.">
      <Card className="p-4 shadow-card mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, service..." className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No appointments match.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap gap-4 justify-between items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-lg">{a.full_name}</h3>
                    <Badge variant="secondary" className={`${statusStyles[a.status]} capitalize`}>{a.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.service}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(a.appointment_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.appointment_time}</span>
                    <a href={`tel:${a.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" /> {a.phone}</a>
                    <a href={`mailto:${a.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" /> {a.email}</a>
                  </div>
                  {a.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{a.notes}"</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status !== "confirmed" && <Button size="sm" variant="hero" onClick={() => updateStatus(a, "confirmed")}><CheckCircle2 className="h-4 w-4" /> Confirm</Button>}
                  {a.status !== "completed" && <Button size="sm" variant="outline" onClick={() => updateStatus(a, "completed")}>Complete</Button>}
                  {a.status !== "cancelled" && <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => updateStatus(a, "cancelled")}><X className="h-4 w-4" /> Cancel</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAppointments;
