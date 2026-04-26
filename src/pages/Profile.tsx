import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save, User as UserIcon, Mail, Phone, ArrowLeft, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", nationality: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase.from("profiles") as any)
        .select("full_name, phone, email, nationality")
        .eq("id", user.id)
        .single();
      if (data) setForm({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
        email: data.email ?? user.email ?? "",
        nationality: data.nationality ?? "",
      });
      setLoading(false);
    })();
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.full_name.trim().length < 2) { toast.error("Please enter your full name"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      nationality: form.nationality.trim(),
    } as any).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  };

  return (
    <Layout>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="container py-12">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm opacity-90 hover:opacity-100 mb-3">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Your Profile</h1>
          <p className="text-sm opacity-90 mt-1">Update your personal information.</p>
        </div>
      </section>

      <section className="container py-10 max-w-2xl">
        <Card className="p-6 md:p-8 shadow-card">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <form onSubmit={onSave} className="space-y-5">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative mt-1.5">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="full_name" value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="pl-9 h-11" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="pl-9 h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <div className="relative mt-1.5">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="nationality" value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  placeholder="e.g. Ghanaian"
                  className="pl-9 h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={form.email} disabled className="pl-9 h-11 bg-muted" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed from here. Contact us if you need to update it.</p>
              </div>
              <Button type="submit" variant="hero" size="lg" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save changes</>}
              </Button>
            </form>
          )}
        </Card>
      </section>
    </Layout>
  );
};

export default Profile;
