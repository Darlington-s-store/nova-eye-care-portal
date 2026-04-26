import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck, CalendarCheck, Sparkles, Mail, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import authBg from "@/assets/hero-auth.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("signin");
  const [view, setView] = useState<"auth" | "verify">(() => 
    sessionStorage.getItem("pending_verify_email") ? "verify" : "auth"
  );
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [signin, setSignin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [emailToVerify, setEmailToVerify] = useState(() => 
    sessionStorage.getItem("pending_verify_email") || ""
  );

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate("/dashboard", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(signin);
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid")) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Welcome back!");
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;
    if (!passwordRegex.test(signup.password)) {
      toast.error("Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: signup.email,
      password: signup.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: signup.full_name, phone: signup.phone },
      },
    });
    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("already")) {
        toast.error("This email is already registered. Please sign in instead.");
        setTab("signin");
        setSignin({ email: signup.email, password: "" });
      } else {
        toast.error(error.message);
      }
      return;
    }
    // With auto-confirm enabled, the user is signed in immediately
    if (data.session) {
      toast.success(`Welcome, ${signup.full_name.split(" ")[0]}! Please complete your registration.`);
      navigate("/register-patient");
    } else {
      // Confirmation required
      const email = signup.email;
      setEmailToVerify(email);
      sessionStorage.setItem("pending_verify_email", email);
      setView("verify");
      toast.info("A 6-digit verification code has been sent to your email.");
    }
    setLoading(false);
  };

  const onVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);

    const { error, data } = await supabase.auth.verifyOtp({
      email: emailToVerify,
      token: otp,
      type: 'signup'
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (data.session) {
      toast.success("Account verified successfully!");
      navigate("/register-patient");
    }
    setLoading(false);
  };

  const resendOtp = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailToVerify
    });
    if (error) toast.error(error.message);
    else toast.success("Code resent!");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Image / brand panel */}
      <aside
        className="relative hidden lg:flex lg:w-1/2 items-end p-12 text-primary-foreground overflow-hidden bg-primary"
      >
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_30%_30%,white_1px,transparent_1px)] [background-size:36px_36px] opacity-10" />
        <div className="relative z-10 max-w-md space-y-6 animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-3 font-bold text-xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white overflow-hidden shadow-sm border">
              <img src={logo} alt="NOVA Eye Care Logo" className="h-full w-full object-contain p-1" />
            </span>
            NOVA Eye Care
          </Link>
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-3">See Better. Live Brighter.</h2>
            <p className="opacity-90 text-lg">
              Manage your appointments, view your visit history, and stay on top of your eye health — all in one place.
            </p>
          </div>
          <ul className="space-y-3 pt-2">
            {[
              { icon: CalendarCheck, t: "Book and reschedule appointments" },
              { icon: ShieldCheck, t: "Your data is private and secure" },
              { icon: Sparkles, t: "Personalized care reminders" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3 opacity-95">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 border border-white/30">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.t}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right: Form panel */}
      <main
        className="relative flex-1 flex items-center justify-center p-6 lg:p-12 bg-muted/30"
      >
        {/* Mobile background tint */}
        <div
          className="lg:hidden absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: `url(${authBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="relative w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-3 text-primary font-bold text-xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white overflow-hidden shadow-sm border">
                <img src={logo} alt="NOVA Eye Care Logo" className="h-full w-full object-contain p-1" />
              </span>
              NOVA Eye Care
            </Link>
          </div>

          <Card className="p-7 md:p-8 shadow-sm border bg-card">
            <div className="mb-6">
              {view === "auth" ? (
                <>
                  <h1 className="text-2xl font-bold">
                    {tab === "signin" ? "Welcome back" : "Create your account"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tab === "signin"
                      ? "Sign in to access your patient portal."
                      : "Join NOVA Eye Care to manage your appointments."}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">Verify your email</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    We've sent a 6-digit token to <strong>{emailToVerify}</strong>.
                  </p>
                </>
              )}
            </div>

            {view === "auth" ? (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid grid-cols-2 w-full mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={onSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="si-email">Email</Label>
                      <Input id="si-email" type="email" required autoComplete="email"
                        placeholder="you@example.com"
                        value={signin.email}
                        onChange={(e) => setSignin({ ...signin, email: e.target.value })}
                        className="mt-1.5 h-11" />
                    </div>
                    <div>
                      <Label htmlFor="si-pw">Password</Label>
                      <div className="relative mt-1.5">
                        <Input id="si-pw" type={showPw ? "text" : "password"} required autoComplete="current-password"
                          placeholder="••••••••"
                          value={signin.password}
                          onChange={(e) => setSignin({ ...signin, password: e.target.value })}
                          className="h-11 pr-10" />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPw ? "Hide password" : "Show password"}>
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" size="lg" className="w-full rounded-lg font-bold" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                    </Button>
                    <div className="flex justify-between text-sm pt-1">
                      <Link to="/forgot-password" className="text-muted-foreground hover:text-primary">Forgot password?</Link>
                      <button type="button" onClick={() => setTab("signup")} className="text-primary font-medium hover:underline">
                        Create account
                      </button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={onSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="su-name">Full Name</Label>
                      <Input id="su-name" required autoComplete="name"
                        placeholder="Akua Mensah"
                        value={signup.full_name}
                        onChange={(e) => setSignup({ ...signup, full_name: e.target.value })}
                        className="mt-1.5 h-11" />
                    </div>
                    <div>
                      <Label htmlFor="su-phone">Phone Number</Label>
                      <Input id="su-phone" type="tel" required autoComplete="tel"
                        placeholder="0244 000 000"
                        value={signup.phone}
                        onChange={(e) => setSignup({ ...signup, phone: e.target.value })}
                        className="mt-1.5 h-11" />
                    </div>
                    <div>
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" type="email" required autoComplete="email"
                        placeholder="you@example.com"
                        value={signup.email}
                        onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                        className="mt-1.5 h-11" />
                    </div>
                    <div>
                      <Label htmlFor="su-pw">Password</Label>
                      <div className="relative mt-1.5">
                        <Input id="su-pw" type={showPw ? "text" : "password"} required minLength={8}
                          autoComplete="new-password"
                          placeholder="Uppercase, lowercase, number, symbol"
                          value={signup.password}
                          onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                          className="h-11 pr-10" />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPw ? "Hide password" : "Show password"}>
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" size="lg" className="w-full rounded-lg font-bold" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      Already have an account?{" "}
                      <button type="button" onClick={() => setTab("signin")} className="text-primary font-medium hover:underline">
                        Sign in
                      </button>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center py-4">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(v) => {
                      setOtp(v);
                      if (v.length === 6) {
                        // Small delay to let city state catch up
                        setTimeout(() => onVerify(), 100);
                      }
                    }}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="h-12 w-10 sm:w-12 sm:h-14 text-lg border-2" />
                      <InputOTPSlot index={1} className="h-12 w-10 sm:w-12 sm:h-14 text-lg border-2" />
                      <InputOTPSlot index={2} className="h-12 w-10 sm:w-12 sm:h-14 text-lg border-2" />
                      <InputOTPSlot index={3} className="h-12 w-10 sm:w-12 sm:h-14 text-lg border-2" />
                      <InputOTPSlot index={4} className="h-12 w-10 sm:w-12 sm:h-14 text-lg border-2" />
                      <InputOTPSlot index={5} className="h-12 w-10 sm:w-12 sm:h-14 text-lg border-2" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button 
                  onClick={() => onVerify()} 
                  size="lg" 
                  className="w-full rounded-lg font-bold" 
                  disabled={loading || otp.length < 6}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Account"}
                </Button>

                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">
                    Didn't receive the code?{" "}
                    <button type="button" onClick={resendOtp} className="text-primary font-medium hover:underline">
                      Resend
                    </button>
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setView("auth")}
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Change email or sign in
                  </button>
                </div>
              </div>
            )}
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link to="/" className="hover:text-primary">← Back to website</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
