import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import authBg from "@/assets/hero-auth.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token in the URL hash
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. You can now sign in.");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-soft-gradient relative">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(${authBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="relative w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-lg mb-6 justify-center w-full">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-hero-gradient text-primary-foreground">
            <Eye className="h-5 w-5" />
          </span>
          NOVA Eye Care
        </Link>

        <Card className="p-7 md:p-8 shadow-elegant">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold">Set a new password</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a strong password you don't use anywhere else.
              </p>
            </div>
          </div>

          {!ready ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Verifying your reset link... If nothing happens, request a new link from <Link to="/forgot-password" className="text-primary underline">Forgot password</Link>.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pw">New password</Label>
                <div className="relative mt-1.5">
                  <Input id="pw" type={show ? "text" : "password"} required minLength={6} autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="cf">Confirm new password</Label>
                <Input id="cf" type={show ? "text" : "password"} required minLength={6} autoComplete="new-password"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 mt-1.5" />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
