import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, Mail, Phone, Calendar, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  appointment_count?: number;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    } catch (error: any) {
      toast.error(error.message);
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
                      <div className="h-14 w-14 rounded-full bg-primary-soft flex items-center justify-center text-primary border border-primary/10">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                          {user.full_name || "Guest User"}
                        </h3>
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
                          className="h-10 px-4 gap-2 text-warning border-warning/20 hover:bg-warning/5"
                          onClick={() => user.email && handleResetPassword(user.email)}
                        >
                          <KeyRound className="h-4 w-4" />
                          <span className="hidden lg:inline">Reset Pass</span>
                        </Button>
                        <Button asChild size="sm" className="h-10 px-4 gap-2">
                          <Link to={`/admin/appointments?user=${user.id}`}>
                            View History
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
    </AdminLayout>
  );
};

export default AdminUsers;
