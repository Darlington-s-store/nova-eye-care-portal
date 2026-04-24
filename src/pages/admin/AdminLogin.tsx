import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck, Lock } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import authBg from "@/assets/hero-auth.jpg";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "admin@novaeyecare.com", password: "" });

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
      if ((roles ?? []).some((r) => r.role === "admin")) {
        navigate("/admin", { replace: true });
      }
    };
    check();
  }, [navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword(form);
    if (error) {
      setLoading(false);
      toast.error("Invalid admin credentials");
      return;
    }
    // Verify admin role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    setLoading(false);
    if (!(roles ?? []).some((r) => r.role === "admin")) {
      await supabase.auth.signOut();
      toast.error("This account does not have admin access.");
      return;
    }
    toast.success("Welcome, Admin");
    navigate("/admin", { replace: true });
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Use at least 8 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { full_name: "Administrator", phone: "" },
      },
    });
    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("already")) {
        toast.error("Admin account already exists. Sign in instead.");
        setTab("signin");
      } else toast.error(error.message);
      return;
    }
    // Try to auto sign-in (auto-confirm is enabled)
    const { data: signInData, error: siErr } = await supabase.auth.signInWithPassword(form);
    setLoading(false);
    if (siErr) {
      toast.success("Admin account created. Please sign in.");
      setTab("signin");
      return;
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", signInData.user.id);
    if (!(roles ?? []).some((r) => r.role === "admin")) {
      await supabase.auth.signOut();
      toast.error("Admin role not assigned. Contact support.");
      return;
    }
    toast.success("Admin account created");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${authBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background/60 to-foreground/80" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6 text-primary-foreground">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="h-20 w-20 rounded-2xl bg-white shadow-elegant overflow-hidden p-2 flex items-center justify-center border border-white/20">
              <img src={logo} alt="NOVA Eye Care Logo" className="h-full w-full object-contain" />
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-white/10 backdrop-blur tracking-widest uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> Restricted Area
            </span>
          </div>
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-sm opacity-90 mt-1">Authorized personnel only</p>
        </div>

        <Card className="p-7 shadow-elegant border-border/30 bg-card/95 backdrop-blur">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">First-time Setup</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={onSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="ai-email">Admin Email</Label>
                  <Input id="ai-email" type="email" required autoComplete="email"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="ai-pw">Password</Label>
                  <div className="relative mt-1.5">
                    <Input id="ai-pw" type={show ? "text" : "password"} required autoComplete="current-password"
                      value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="h-11 pr-10" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lock className="h-4 w-4" /> Sign in</>}
                </Button>
                <p className="text-center text-xs text-muted-foreground pt-1">
                  <Link to="/forgot-password" className="hover:text-primary">Forgot password?</Link>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <div className="rounded-md bg-primary-soft p-3 text-xs text-primary mb-4">
                Use this <strong>once</strong> to create the seeded admin account. The email{" "}
                <strong>admin@novaeyecare.com</strong> is pre-authorized for admin access.
              </div>
              <form onSubmit={onSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="as-email">Admin Email</Label>
                  <Input id="as-email" type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label htmlFor="as-pw">Password</Label>
                  <div className="relative mt-1.5">
                    <Input id="as-pw" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password"
                      value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="h-11 pr-10" placeholder="At least 8 characters" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Suggested: <code className="text-foreground">Admin@novacare</code></p>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create admin account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-primary-foreground/80 mt-6">
          <Link to="/" className="hover:text-primary-foreground">← Back to website</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
