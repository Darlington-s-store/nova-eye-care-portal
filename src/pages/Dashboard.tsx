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
  User, Star, RefreshCw, ShieldCheck, ArrowRight, History, Eye,
  Sparkles, CheckCircle2, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  pending: "bg-yellow-100 text-yellow-900 border-yellow-200",
  confirmed: "bg-primary-soft text-primary border-primary/20",
  cancelled: "bg-muted text-muted-foreground border-border/40",
  completed: "bg-green-100 text-green-900 border-green-200",
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
      const [apptsRes, profRes, screensRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("user_id", user.id).order("appointment_date", { ascending: false }),
        supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).single(),
        (supabase as unknown as { 
          from: (t: string) => { 
            select: (s: string) => { 
              eq: (k: string, v: string) => { 
                eq: (k2: string, v2: boolean) => { 
                  order: (c: string, o: { ascending: boolean }) => Promise<{data: unknown, error: unknown}> 
                } 
              } 
            } 
          } 
        }).from("eye_screenings").select("id, screening_date, diagnosis, va_right_eye, va_left_eye").eq("patient_id", user.id).eq("is_visible_to_patient", true).order("screening_date", { ascending: false })
      ]);
      
      setAppointments((apptsRes.data as Appointment[]) || []);
      setProfile(profRes.data as Profile);
      setScreenings((screensRes.data as unknown as Screening[]) || []);
      setLoading(false);
    })();

    const ch = supabase.channel(`dash-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `user_id=eq.${user.id}` },
        async () => {
          const { data: appts } = await supabase.from("appointments").select("*").eq("user_id", user.id).order("appointment_date", { ascending: false });
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 25, stiffness: 200 } },
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
        <div className="container py-32 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary/30" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-primary relative overflow-hidden pt-20 pb-24">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        
        <div className="container relative z-10 flex flex-wrap gap-8 items-center justify-between text-white">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold rounded-full bg-white/10 text-white/80 mb-4 tracking-[0.2em] uppercase">
              <Sparkles className="h-3 w-3" /> Patient Dashboard
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
              Hello, {profile?.full_name?.split(' ')[0] || "Patient"}
            </h1>
            <p className="text-white/70 font-medium">Manage your eye care appointments and health records.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap gap-3"
          >
            {isAdmin && (
              <Button asChild variant="secondary" className="rounded-2xl h-14 px-8 font-bold gap-2 shadow-lg shadow-black/10">
                <Link to="/admin"><ShieldCheck className="h-5 w-5" /> Admin Portal</Link>
              </Button>
            )}
            <Button asChild variant="secondary" className="rounded-2xl h-14 px-8 font-bold gap-2 shadow-lg shadow-black/10">
              <Link to="/book"><CalendarPlus className="h-5 w-5" /> New Booking</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {!loading && profile && !profile.registration_completed && (
        <section className="container mt-[-40px] relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 bg-amber-50 border-amber-200 border-2 rounded-[2.5rem] shadow-elegant overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6 text-center md:text-left">
                  <div className="h-16 w-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shrink-0 shadow-sm">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-amber-900 mb-1">Complete Your Profile</h2>
                    <p className="text-amber-700/80 font-medium max-w-md">
                      Required for first-time visitors to ensure the best clinical care.
                    </p>
                  </div>
                </div>
                <Button asChild size="hero" className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl px-10 font-bold gap-2 w-full md:w-auto shadow-lg shadow-amber-900/10 transition-all">
                  <Link to="/register-patient">Finish Now <ArrowRight className="h-5 w-5" /></Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </section>
      )}

      <section className="container py-16 grid gap-10 lg:grid-cols-12 max-w-7xl mx-auto">
        {/* Sidebar Info */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-4 space-y-6"
        >
          <motion.div variants={item}>
            <Card className="p-8 rounded-[2rem] shadow-card border-border/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-soft/50 rounded-bl-full -mr-16 -mt-16" />
              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-sm">
                  <User className="h-6 w-6" />
                </div>
                <h2 className="font-bold text-xl tracking-tight">Your Details</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Full Name</p>
                  <p className="font-bold text-lg text-foreground">{profile?.full_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Email Address</p>
                  <p className="font-bold text-foreground break-all">{profile?.email || user?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Contact Number</p>
                  <p className="font-bold text-foreground">{profile?.phone || "—"}</p>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full mt-10 rounded-xl h-12 font-bold hover:bg-primary-soft hover:text-primary transition-all">
                <Link to="/profile">Edit Profile Information</Link>
              </Button>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="p-8 bg-primary/5 border-primary/10 rounded-[2rem] shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary border shadow-sm group-hover:rotate-12 transition-transform">
                  <History className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-lg">Medical History</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Update your clinical details to help us personalize your eye care.
              </p>
              <Button asChild variant="outline" size="sm" className="w-full rounded-xl h-11 bg-white border-primary/10 font-bold hover:bg-primary hover:text-white transition-all">
                <Link to="/medical-history" className="gap-2">Manage Profile <ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="p-8 bg-secondary/30 rounded-[2rem] border-none shadow-sm group">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary border shadow-sm group-hover:scale-110 transition-transform">
                  <Star className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-lg">Feedback</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Share your experience with us.</p>
              <Button asChild variant="outline" size="sm" className="w-full rounded-xl h-11 bg-white font-bold hover:bg-primary hover:text-white transition-all border-none">
                <Link to="/reviews">Write a Review</Link>
              </Button>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-2xl tracking-tight">Upcoming Appointments</h2>
              {upcoming.length > 0 && <Badge variant="secondary" className="rounded-lg font-bold bg-primary/10 text-primary border-none">{upcoming.length} active</Badge>}
            </div>
            
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /></div>
            ) : upcoming.length === 0 ? (
              <motion.div variants={item}>
                <Card className="p-12 text-center border-dashed border-2 rounded-[2.5rem] bg-muted/20">
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">No Appointments Scheduled</h3>
                  <p className="text-muted-foreground mb-8 max-w-xs mx-auto italic">Looks like you haven't booked anything yet. Ready to see better?</p>
                  <Button asChild size="hero" className="rounded-2xl px-10 font-bold"><Link to="/book">Schedule Exam Now</Link></Button>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {upcoming.map((a) => (
                  <motion.div key={a.id} variants={item}>
                    <AppointmentCard a={a} onCancel={cancelAppointment} onReschedule={(x) => { setReschedule(x); setRNew({ date: x.appointment_date, time: x.appointment_time }); }} canManage />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {past.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="font-bold text-xl mb-6 text-muted-foreground/60 tracking-tight">History & Activity</h2>
              <div className="space-y-3 opacity-70 hover:opacity-100 transition-opacity">
                {past.slice(0, 3).map((a) => <AppointmentCard key={a.id} a={a} onCancel={cancelAppointment} onReschedule={() => {}} />)}
              </div>
            </motion.div>
          )}

          {screenings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="pt-4"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-bold text-2xl tracking-tight flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary-soft text-primary rounded-xl flex items-center justify-center">
                    <Eye className="h-6 w-6" />
                  </div>
                  Clinical Reports
                </h2>
                <Badge variant="secondary" className="rounded-xl bg-primary/10 text-primary border-0 font-bold px-4 py-2">
                  Most Recent
                </Badge>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {screenings.map((s) => (
                  <Card key={s.id} className="p-8 rounded-[2rem] border border-border/40 shadow-card hover:shadow-elegant transition-all bg-white relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col gap-6 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 py-1.5 rounded-full bg-secondary/50">
                          {new Date(s.screening_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex gap-2">
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-bold text-muted-foreground/50 uppercase">R-Eye</span>
                            <Badge variant="outline" className="text-xs font-bold border-primary/20 text-primary bg-primary/5">{s.va_right_eye || '-'}</Badge>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-bold text-muted-foreground/50 uppercase">L-Eye</span>
                            <Badge variant="outline" className="text-xs font-bold border-primary/20 text-primary bg-primary/5">{s.va_left_eye || '-'}</Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                          Clinical Impression
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">"{s.diagnosis || "Consultation record saved."}"</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Dialog open={!!reschedule} onOpenChange={(o) => !o && setReschedule(null)}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-elegant p-10 max-w-md">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">Reschedule Visit</DialogTitle>
            <DialogDescription className="font-medium text-primary uppercase text-[10px] tracking-[0.2em]">{reschedule?.service}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="rd" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Select New Date</Label>
              <Input id="rd" type="date" min={minDate} value={rNew.date}
                onChange={(e) => setRNew({ ...rNew, date: e.target.value, time: "" })}
                className="h-14 rounded-xl border-border/60 px-4 focus:ring-primary/20" />
              {rSunday && <p className="text-[10px] font-bold text-destructive mt-1 uppercase tracking-wider">Closed on Sundays</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Available Slots</Label>
              <Select value={rNew.time} onValueChange={(v) => setRNew({ ...rNew, time: v })} disabled={!rNew.date || rSunday}>
                <SelectTrigger className="h-14 rounded-xl border-border/60 px-4"><SelectValue placeholder="Choose a time" /></SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl border-border/60">
                  {rSlots.map((t) => <SelectItem key={t} value={t} className="rounded-lg">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-10 sm:flex-col gap-3">
            <Button variant="hero" onClick={submitReschedule} disabled={!rNew.date || !rNew.time || rSaving} className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20">
              {rSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm New Time"}
            </Button>
            <Button variant="ghost" onClick={() => setReschedule(null)} className="w-full h-12 rounded-xl font-bold text-muted-foreground">Keep Original</Button>
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
  <Card className="p-8 rounded-[2rem] border border-border/40 shadow-card hover:shadow-elegant transition-all duration-500 bg-white group">
    <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
      <div className="flex items-start gap-5">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border", 
          a.status === 'confirmed' ? "bg-primary-soft text-primary border-primary/10" : "bg-muted text-muted-foreground border-border/40")}>
          {a.status === 'confirmed' ? <CheckCircle2 className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
        </div>
        <div>
          <h3 className="font-bold text-xl tracking-tight mb-2 group-hover:text-primary transition-colors">{a.service}</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider italic">
              <Calendar className="h-4 w-4 text-primary" /> {new Date(a.appointment_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider italic">
              <Clock className="h-4 w-4 text-primary" /> {a.appointment_time}
            </span>
          </div>
        </div>
      </div>
      <Badge className={cn("rounded-full px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest border shadow-sm", statusStyles[a.status])} variant="secondary">
        {a.status === "pending" ? "Awaiting Confirmation" : a.status}
      </Badge>
    </div>
    
    {a.notes && (
      <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border/40">
        <p className="text-sm text-muted-foreground flex items-start gap-3">
          <FileText className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <span className="italic leading-relaxed font-medium">"{a.notes}"</span>
        </p>
      </div>
    )}
    
    {canManage && a.status !== "cancelled" && (
      <div className="flex flex-wrap gap-3 pt-2">
        <Button size="sm" variant="outline" onClick={() => onReschedule(a)} className="rounded-xl h-11 px-6 font-bold gap-2 hover:bg-primary hover:text-white transition-all border-border/60">
          <RefreshCw className="h-4 w-4" /> Reschedule
        </Button>
        <Button size="sm" variant="ghost" className="rounded-xl h-11 px-6 font-bold gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => onCancel(a)}>
          <CalendarX className="h-4 w-4" /> Cancel Booking
        </Button>
      </div>
    )}
  </Card>
);

export default Dashboard;

