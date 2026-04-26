import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, User, Mail, Phone, Calendar, ArrowRight, Loader2, KeyRound, 
  MapPin, HeartPulse, PhoneCall, Info
} from "lucide-react";

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  appointment_count?: number;
  registration_completed?: boolean;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (pError) throw pError;

      // Fetch appointment counts for each user
      const { data: counts } = await supabase
        .from("appointments")
        .select("user_id");

      const userList = (profiles || []).map(p => ({
        ...p,
        appointment_count: counts?.filter(c => c.user_id === p.id).length || 0
      }));

      setUsers(userList);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    if (error) toast.error(error.message);
    else toast.success(`Password reset email sent to ${email}`);
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  return (
    <AdminLayout title="User Management" subtitle="Manage patient accounts and view engagement history.">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email or phone..." 
              className="pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Showing {filteredUsers.length} of {users.length} patients
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-semibold">No users found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria.</p>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-5 hover:shadow-md transition-all border-border/40 group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-primary border border-border">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {user.full_name || "Guest User"}
                          </h3>
                          {user.registration_completed && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 text-[10px] h-5 rounded-full px-2">
                              Registered
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user.email || "No email"}</span>
                          {user.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:gap-8">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Bookings</p>
                        <Badge variant="secondary" className="px-3 py-1 font-bold">
                          {user.appointment_count} Appointments
                        </Badge>
                      </div>
                      
                      <div className="text-center hidden sm:block">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Joined</p>
                        <p className="text-sm font-medium">
                          {new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-4 gap-2 border-border/60"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Info className="h-4 w-4" />
                          <span className="hidden lg:inline">Details</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-4 gap-2 text-warning border-warning/20 hover:bg-warning/5"
                          onClick={() => user.email && handleResetPassword(user.email)}
                        >
                          <KeyRound className="h-4 w-4" />
                          <span className="hidden lg:inline">Reset Pass</span>
                        </Button>
                        <Button asChild size="sm" className="h-10 px-4 gap-2">
                          <Link to={`/admin/appointments?user=${user.id}`}>
                            History
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl border-0">
          {selectedUser && (
            <div className="bg-background">
              <DialogHeader className="p-8 pb-4 bg-primary text-primary-foreground relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-16 w-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">{selectedUser.full_name || "Patient Profile"}</DialogTitle>
                    <p className="opacity-80">Patient Since {new Date(selectedUser.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-8 grid gap-8 md:grid-cols-2 overflow-y-auto max-h-[70vh] bg-background">
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-widest bg-muted py-1 px-3 rounded-full w-fit">
                      <Info className="h-3 w-3" /> Basic Info
                    </div>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">DOB</dt>
                        <dd className="font-semibold text-sm">{selectedUser.date_of_birth || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gender</dt>
                        <dd className="font-semibold text-sm capitalize">{selectedUser.gender || "—"}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-widest bg-muted py-1 px-3 rounded-full w-fit">
                      <MapPin className="h-3 w-3" /> Address Info
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Residential Address</dt>
                      <dd className="font-medium text-sm leading-relaxed">{selectedUser.address || "No address on file"}</dd>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-widest py-1 px-3 rounded-full w-fit bg-muted">
                      <PhoneCall className="h-3 w-3" /> Emergency Contact
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg border">
                      <p className="font-bold text-sm">{selectedUser.emergency_contact_name || "Not specified"}</p>
                      <p className="text-primary font-medium text-sm mt-1 flex items-center gap-2">
                        <Phone className="h-3 w-3" /> {selectedUser.emergency_contact_phone || "—"}
                      </p>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-widest bg-primary/5 py-1 px-3 rounded-full w-fit">
                      <HeartPulse className="h-3 w-3" /> Medical Details
                    </div>
                    <div className="space-y-4">
                      <div>
                        <dt className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Blood Group</dt>
                        <dd className="inline-block mt-1 font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-lg">
                          {selectedUser.blood_group || "Unknown"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Clinical History</dt>
                        <dd className="mt-2 text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-2xl italic border border-muted/30">
                          {selectedUser.medical_history || "No medical history recorded."}
                        </dd>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
              
              <div className="p-6 bg-white/50 border-t border-muted/30 flex justify-between gap-3">
                <Button variant="ghost" className="rounded-xl" onClick={() => setSelectedUser(null)}>Close Profile</Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link to={`/admin/appointments?user=${selectedUser.id}`}>Appointment History</Link>
                  </Button>
                  <Button className="rounded-xl"  onClick={() => {
                    const mailto = `mailto:${selectedUser.email}`;
                    window.location.href = mailto;
                  }}>Email Patient</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
