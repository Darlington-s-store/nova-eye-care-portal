import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Eye, Loader2, MailCheck } from "lucide-react";
import authBg from "@/assets/hero-auth.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
                <MailCheck className="h-9 w-9" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
              <p className="text-sm text-muted-foreground mb-6">
                If an account exists for <strong className="text-foreground">{email}</strong>, we've sent a password reset link. Follow the instructions in the email to set a new password.
              </p>
              <Button asChild variant="hero" className="w-full">
                <Link to="/auth">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Forgot your password?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" type="email" required autoComplete="email"
                    placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </Button>
                <Link to="/auth" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary pt-2">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </Link>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
