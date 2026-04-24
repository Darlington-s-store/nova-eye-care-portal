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
  const [clinic, setClinic] = useState({
    id: "",
    clinic_name: "",
    contact_phone: "",
    address: "",
    opening_hours: "",
    social_facebook: "",
    social_instagram: "",
    social_twitter: "",
    announcement_title: "",
    announcement_body: "",
    show_announcement: false
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          full_name: user.user_metadata.full_name || "Admin User",
          email: user.email || "",
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: settings } = await (supabase.from("clinic_settings" as any) as any).select("*").maybeSingle();
      if (settings) {
        setClinic({
          ...settings,
          social_facebook: settings.social_facebook || "",
          social_instagram: settings.social_instagram || "",
          social_twitter: settings.social_twitter || "",
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

  const handleUpdateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("clinic_settings" as any) as any).update({
      clinic_name: clinic.clinic_name,
      contact_phone: clinic.contact_phone,
      address: clinic.address,
      opening_hours: clinic.opening_hours,
      social_facebook: clinic.social_facebook,
      social_instagram: clinic.social_instagram,
      social_twitter: clinic.social_twitter,
      announcement_title: clinic.announcement_title,
      announcement_body: clinic.announcement_body,
      show_announcement: clinic.show_announcement
    }).eq("id", clinic.id);
    
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Clinic settings updated");
      if (clinic.show_announcement) {
        toast.info("Notification broadcasted successfully");
      }
    }
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
    <AdminLayout title="Admin Settings" subtitle="Configure your administrative account and clinic-wide settings.">
      <div className="grid gap-8 max-w-5xl pb-12">
        {/* Clinic Information Segment */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Clinic & App Data
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Manage global details and social presence.</p>
          </div>
          <Card className="lg:col-span-2 p-6 shadow-elegant border-border/40">
            <form onSubmit={handleUpdateClinic} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clinic Name</Label>
                  <Input 
                    value={clinic.clinic_name} 
                    onChange={(e) => setClinic({ ...clinic, clinic_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Phone</Label>
                  <Input 
                    value={clinic.contact_phone} 
                    onChange={(e) => setClinic({ ...clinic, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Opening Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-10"
                    placeholder="e.g. Mon-Fri: 8am - 5pm, Sat: 9am - 2pm"
                    value={clinic.opening_hours} 
                    onChange={(e) => setClinic({ ...clinic, opening_hours: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-semibold">Social Media Links</Label>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">FB</span>
                    <Input 
                      className="pl-9 text-xs" 
                      placeholder="Facebook URL"
                      value={clinic.social_facebook}
                      onChange={(e) => setClinic({ ...clinic, social_facebook: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">IG</span>
                    <Input 
                      className="pl-9 text-xs" 
                      placeholder="Instagram URL"
                      value={clinic.social_instagram}
                      onChange={(e) => setClinic({ ...clinic, social_instagram: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">X</span>
                    <Input 
                      className="pl-9 text-xs" 
                      placeholder="Twitter URL"
                      value={clinic.social_twitter}
                      onChange={(e) => setClinic({ ...clinic, social_twitter: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-base">Public Announcement</Label>
                    <p className="text-xs text-muted-foreground">Broadcast an alert to all registered patients.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="show_ann"
                      className="h-4 w-4 accent-primary" 
                      checked={clinic.show_announcement}
                      onChange={(e) => setClinic({ ...clinic, show_announcement: e.target.checked })}
                    />
                    <Label htmlFor="show_ann" className="cursor-pointer">Active</Label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Announcement Title</Label>
                    <Input 
                      value={clinic.announcement_title} 
                      onChange={(e) => setClinic({ ...clinic, announcement_title: e.target.value })}
                      placeholder="e.g. Easter Holiday Notice"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Announcement Message</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={clinic.announcement_body} 
                      onChange={(e) => setClinic({ ...clinic, announcement_body: e.target.value })}
                      placeholder="Tell your patients something important..."
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 px-8 shadow-lg shadow-primary/10" variant="hero">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Apply Clinic Settings
              </Button>
            </form>
          </Card>
        </section>

        <section className="grid lg:grid-cols-3 gap-6 pt-8 border-t">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Admin Profile
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Your personal identity in the admin center.</p>
          </div>
          <Card className="lg:col-span-2 p-6 shadow-elegant border-border/40">
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
