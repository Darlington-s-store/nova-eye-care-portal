import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notifyAdmins, notifyUser } from "@/lib/notify";
import { TIME_SLOTS_WEEKDAY, TIME_SLOTS_SATURDAY } from "@/lib/clinic";
import { toast } from "sonner";
import {
  CalendarPlus, CalendarX, Calendar, Clock, FileText, Loader2,
  User, Star, RefreshCw, ShieldCheck, ArrowRight, History, Eye
} from "lucide-react";

type Appointment = {
  id: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
};

type Profile = {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  registration_completed: boolean | null;
};

type Screening = {
  id: string;
  screening_date: string;
  diagnosis: string;
  va_right_eye: string;
  va_left_eye: string;
};

const statusStyles: Record<Appointment["status"], string> = {
  pending: "bg-yellow-100 text-yellow-900 hover:bg-yellow-100",
  confirmed: "bg-primary-soft text-primary hover:bg-primary-soft",
  cancelled: "bg-muted text-muted-foreground hover:bg-muted",
  completed: "bg-green-100 text-green-900 hover:bg-green-100",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const [rNew, setRNew] = useState({ date: "", time: "" });
  const [rSaving, setRSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: appts }, { data: prof }, { data: screens }] = await Promise.all([
        supabase.from("appointments").select("*").eq("user_id", user.id).order("appointment_date", { ascending: false }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("profiles").select("full_name, phone, email, registration_completed").eq("id", user.id).single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("eye_screenings").select("id, screening_date, diagnosis, va_right_eye, va_left_eye").eq("patient_id", user.id).eq("is_visible_to_patient", true).order("screening_date", { ascending: false })
      ]);
      setAppointments((appts as Appointment[]) || []);
      setProfile(prof as Profile);
      setScreenings((screens as unknown as Screening[]) || []);
      setLoading(false);
    })();

    const ch = supabase.channel(`dash-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `user_id=eq.${user.id}` },
        async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: appts } = await (supabase as any).from("appointments").select("*").eq("user_id", user.id).order("appointment_date", { ascending: false });
          setAppointments((appts as Appointment[]) || []);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const cancelAppointment = async (a: Appointment) => {
    if (!confirm("Cancel this appointment?")) return;
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    await notifyAdmins({
      title: "Appointment cancelled",
      body: `${profile?.full_name ?? "A patient"} cancelled their ${a.service} on ${new Date(a.appointment_date).toLocaleDateString("en-GB")}.`,
      link: "/admin/appointments",
    });
    if (user) await notifyUser(user.id, { title: "Appointment cancelled", body: `Your ${a.service} appointment was cancelled.`, link: "/dashboard" });
    toast.success("Appointment cancelled");
  };

  const submitReschedule = async () => {
    if (!reschedule || !rNew.date || !rNew.time) return;
    setRSaving(true);
    const { error } = await supabase.from("appointments").update({
      appointment_date: rNew.date,
      appointment_time: rNew.time,
      status: "pending",
    }).eq("id", reschedule.id);
    setRSaving(false);
    if (error) { toast.error(error.message); return; }
    await notifyAdmins({
      title: "Appointment rescheduled",
      body: `${profile?.full_name ?? "A patient"} rescheduled ${reschedule.service} to ${new Date(rNew.date).toLocaleDateString("en-GB")} at ${rNew.time}.`,
      link: "/admin/appointments",
    });
    if (user) await notifyUser(user.id, { title: "Appointment rescheduled", body: `New time: ${new Date(rNew.date).toLocaleDateString("en-GB")} at ${rNew.time}. Pending confirmation.`, link: "/dashboard" });
    toast.success("Rescheduled — awaiting confirmation");
    setReschedule(null);
    setRNew({ date: "", time: "" });
  };


  const today = new Date(new Date().toDateString());
  const upcoming = appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed" && new Date(a.appointment_date) >= today);
  const past = appointments.filter((a) => !upcoming.includes(a));

  const minDate = new Date().toISOString().split("T")[0];
  const rDay = rNew.date ? new Date(rNew.date).getDay() : null;
  const rSlots = rDay === 6 ? TIME_SLOTS_SATURDAY : TIME_SLOTS_WEEKDAY;
  const rSunday = rDay === 0;

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="container py-12 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Welcome back,</p>
            <h1 className="text-2xl md:text-3xl font-bold">{profile?.full_name || user?.email}</h1>
          </div>
          <div className="flex gap-2 items-center">
            {isAdmin && (
              <Button asChild variant="outline" className="bg-white/10 border-white/40 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground">
                <Link to="/admin"><ShieldCheck className="h-4 w-4" /> Admin</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="bg-white/10 border-white/40 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground">
              <Link to="/book"><CalendarPlus className="h-4 w-4" /> New</Link>
            </Button>
          </div>
        </div>
      </section>

      {!loading && profile && !profile.registration_completed && (
        <section className="container mt-8 animate-fade-in">
          <Card className="p-6 bg-amber-50 border-amber-100 border-2 rounded-[2rem] shadow-lg shadow-amber-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-amber-200/40 transition-colors" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shadow-inner">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-amber-900">Complete Your Patient Profile</h2>
                  <p className="text-amber-700/80 text-sm max-w-md">
                    Finish your registration to help our clinical team provide you with the best possible personalized care.
                  </p>
                </div>
              </div>
              <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-8 font-bold gap-2 w-full md:w-auto shadow-lg shadow-amber-600/20">
                <Link to="/register-patient">Finish Registration <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
        </section>
      )}

      <section className="container py-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <User className="h-5 w-5" />
              </span>
              <h2 className="font-semibold">Your Profile</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Name</dt>
                <dd className="font-medium">{profile?.full_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Email</dt>
                <dd className="font-medium break-all">{profile?.email || user?.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Phone</dt>
                <dd className="font-medium">{profile?.phone || "—"}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" size="sm" className="w-full mt-5">
              <Link to="/profile">Edit profile</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Star className="h-5 w-5" />
              </span>
              <h2 className="font-semibold">Share experience</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Help others by leaving a review.</p>
            <Button asChild variant="hero" size="sm" className="w-full">
              <Link to="/reviews">Write a review</Link>
            </Button>
          </Card>

          <Card className="p-6 bg-primary/5 border-primary/10 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm group-hover:scale-110 transition-transform">
                <History className="h-5 w-5" />
              </span>
              <h2 className="font-bold">Medical History</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5 relative z-10 leading-relaxed">
              Update your ocular and systemic conditions to help us personalize your care.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full rounded-xl bg-white border-primary/20 hover:bg-primary hover:text-white transition-all relative z-10">
              <Link to="/medical-history" className="gap-2">Manage History <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-bold text-xl mb-4">Upcoming Appointments</h2>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : upcoming.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No upcoming appointments.</p>
                <Button asChild variant="hero"><Link to="/book">Book your first appointment</Link></Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <AppointmentCard key={a.id} a={a} onCancel={cancelAppointment} onReschedule={(x) => { setReschedule(x); setRNew({ date: x.appointment_date, time: x.appointment_time }); }} canManage />
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div>
              <h2 className="font-bold text-xl mb-4">Past & Cancelled</h2>
              <div className="space-y-3">
                {past.map((a) => <AppointmentCard key={a.id} a={a} onCancel={cancelAppointment} onReschedule={() => {}} />)}
              </div>
            </div>
          )}

          {screenings.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" /> Screening Results
                </h2>
                <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary border-0 font-bold px-3 py-1">
                  Latest First
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {screenings.map((s) => (
                  <Card key={s.id} className="p-6 rounded-[2rem] border-0 shadow-sm hover:shadow-elegant transition-shadow bg-white relative group">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                          {new Date(s.screening_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">{s.va_right_eye || '-'}</Badge>
                          <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">{s.va_left_eye || '-'}</Badge>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground mb-1">Clinical Impression</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">"{s.diagnosis || "Consultation record saved."}"</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!reschedule} onOpenChange={(o) => !o && setReschedule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>{reschedule?.service}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rd">New date</Label>
              <Input id="rd" type="date" min={minDate} value={rNew.date}
                onChange={(e) => setRNew({ ...rNew, date: e.target.value, time: "" })}
                className="mt-1.5" />
              {rSunday && <p className="text-xs text-destructive mt-1">Closed on Sundays.</p>}
            </div>
            <div>
              <Label>New time</Label>
              <Select value={rNew.time} onValueChange={(v) => setRNew({ ...rNew, time: v })} disabled={!rNew.date || rSunday}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a time" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {rSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReschedule(null)}>Cancel</Button>
            <Button variant="hero" onClick={submitReschedule} disabled={!rNew.date || !rNew.time || rSaving}>
              {rSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout >
  );
};

const AppointmentCard = ({ a, onCancel, onReschedule, canManage }: {
  a: Appointment;
  onCancel: (a: Appointment) => void;
  onReschedule: (a: Appointment) => void;
  canManage?: boolean;
}) => (
  <Card className="p-5">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
      <div>
        <h3 className="font-semibold">{a.service}</h3>
        <p className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(a.appointment_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.appointment_time}</span>
        </p>
      </div>
      <Badge className={statusStyles[a.status]} variant="secondary">{a.status === "pending" ? "Requested" : a.status}</Badge>
    </div>
    {a.notes && (
      <p className="text-sm text-muted-foreground flex items-start gap-2 mb-3">
        <FileText className="h-4 w-4 mt-0.5 shrink-0" />{a.notes}
      </p>
    )}
    {canManage && a.status !== "cancelled" && (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onReschedule(a)}>
          <RefreshCw className="h-4 w-4" /> Reschedule
        </Button>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onCancel(a)}>
          <CalendarX className="h-4 w-4" /> Cancel
        </Button>
      </div>
    )}
  </Card>
);

export default Dashboard;
