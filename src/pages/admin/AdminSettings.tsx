import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Lock, Mail, User, Loader2, Save } from "lucide-react";

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          full_name: user.user_metadata.full_name || "Admin User",
          email: user.email || "",
        });
      }
    })();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: profile.full_name }
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated successfully");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: passwords.new
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    }
  };

  return (
    <AdminLayout title="Admin Settings" subtitle="Configure your administrative account and security.">
      <div className="grid gap-6 max-w-4xl">
        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold mb-1">Account Profile</h2>
            <p className="text-sm text-muted-foreground">Update your administrative identity.</p>
          </div>
          <Card className="md:col-span-2 p-6 shadow-card">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="pl-10"
                    placeholder="Administrator Name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    value={profile.email}
                    disabled
                    className="pl-10 bg-muted/50 cursor-not-allowed opacity-70"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Email is locked for security. Contact technical support to change.
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </form>
          </Card>
        </section>

        <section className="grid md:grid-cols-3 gap-6 pt-6 border-t">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold mb-1">Security</h2>
            <p className="text-sm text-muted-foreground">Manage your access credentials.</p>
          </div>
          <Card className="md:col-span-2 p-6 shadow-card">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="new_password"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="pl-10"
                    placeholder="Enter at least 8 characters"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirm_password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="pl-10"
                    placeholder="Verify new password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="hero" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Update Security Credentials
              </Button>
            </form>
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
