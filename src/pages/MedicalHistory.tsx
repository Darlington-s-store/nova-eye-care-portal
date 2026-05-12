import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  History, 
  Save, 
  Loader2, 
  Stethoscope, 
  Pill, 
  Users2, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck,
  FileHeart
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageHero } from "@/components/PageHero";
import heroAuth from "@/assets/hero-auth.jpg";

export default function MedicalHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [history, setHistory] = useState({
    ocular_history: "",
    systemic_conditions: "",
    current_medications: "",
    family_eye_history: "",
    allergies: ""
  });

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data, error } = await (supabase as unknown as { 
      from: (t: string) => { 
        select: (s: string) => { 
          eq: (k: string, v: string) => { 
            maybeSingle: () => Promise<{data: Record<string, unknown> | null, error: unknown}> 
          } 
        } 
      } 
    }).from("patient_medical_history")
      .select("*")
      .eq("patient_id", user.id)
      .maybeSingle();

    if (error) {
      toast.error("Could not load medical history");
    } else if (data) {
      const d = data as Record<string, string | null>;
      setHistory({
        ocular_history: d.ocular_history || "",
        systemic_conditions: d.systemic_conditions || "",
        current_medications: d.current_medications || "",
        family_eye_history: d.family_eye_history || "",
        allergies: d.allergies || "",
      });
    }
    setFetching(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user, fetchHistory]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await (supabase as unknown as { 
      from: (t: string) => { 
        upsert: (d: Record<string, unknown>, o: { onConflict: string }) => Promise<{error: unknown}> 
      } 
    }).from("patient_medical_history").upsert({
      patient_id: user.id,
      ...history,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'patient_id' });

    if (error) {
      toast.error((error as { message?: string }).message || "Could not save medical history");
      setLoading(false);
      return;
    } else {
      toast.success("Medical history updated successfully");
    }
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 25, stiffness: 200 } },
  };

  if (fetching) {
    return (
      <Layout>
        <div className="container py-32 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
            <FileHeart className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="font-bold text-lg text-muted-foreground animate-pulse tracking-tight">Consulting health records...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero
        image={heroAuth}
        eyebrow="Clinical Profile"
        title="Medical History"
        subtitle="Help our specialists provide precise care by keeping your health information up to date."
      />

      <div className="container py-16 -mt-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button asChild variant="ghost" className="rounded-xl hover:bg-primary-soft hover:text-primary transition-all">
            <Link to="/dashboard" className="gap-2 font-bold"><ChevronLeft className="h-4 w-4" /> Back to Dashboard</Link>
          </Button>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-12 max-w-7xl mx-auto">
          {/* Main Form */}
          <div className="lg:col-span-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-8"
            >
              <Card className="p-8 md:p-10 rounded-[2.5rem] shadow-elegant border-border/40 bg-white/80 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -mr-32 -mt-32 pointer-events-none" />
                
                <div className="space-y-12 relative z-10">
                  <Section 
                    icon={History} 
                    title="Ocular History" 
                    description="Previous eye surgeries, trauma, or diagnosed conditions."
                    value={history.ocular_history}
                    onChange={(v) => setHistory({...history, ocular_history: v})}
                    placeholder="e.g. Previous laser surgery in 2018, history of glaucoma in right eye..."
                    variants={itemVariants}
                  />

                  <Section 
                    icon={Stethoscope} 
                    title="Systemic Conditions" 
                    description="Chronic health issues (diabetes, hypertension, heart disease)."
                    value={history.systemic_conditions}
                    onChange={(v) => setHistory({...history, systemic_conditions: v})}
                    placeholder="e.g. Type 2 Diabetes for 5 years, Hypertension well-managed..."
                    variants={itemVariants}
                  />

                  <Section 
                    icon={Pill} 
                    title="Current Medications" 
                    description="Eye drops or systemic prescriptions you are taking."
                    value={history.current_medications}
                    onChange={(v) => setHistory({...history, current_medications: v})}
                    placeholder="e.g. Metformin 500mg, Timolol eye drops (Daily)..."
                    variants={itemVariants}
                  />

                  <Section 
                    icon={AlertCircle} 
                    title="Allergies" 
                    description="Drug sensitivities (anaesthetics, iodine, preservatives)."
                    value={history.allergies}
                    onChange={(v) => setHistory({...history, allergies: v})}
                    placeholder="e.g. Penicillin, specific preservative in eye drops..."
                    variants={itemVariants}
                  />

                  <Section 
                    icon={Users2} 
                    title="Family Eye History" 
                    description="Known vision problems in your immediate family."
                    value={history.family_eye_history}
                    onChange={(v) => setHistory({...history, family_eye_history: v})}
                    placeholder="e.g. Father has macular degeneration, Sister has early onset cataracts..."
                    variants={itemVariants}
                  />
                </div>
              </Card>

              <motion.div variants={itemVariants} className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={loading} 
                  size="hero" 
                  className="rounded-2xl px-12 font-bold gap-3 shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Save Health Profile
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Sidebar / Info */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-8 bg-primary text-primary-foreground rounded-[2rem] shadow-elegant border-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  Why this matters
                </h3>
                <div className="space-y-4 text-primary-foreground/90 leading-relaxed font-medium">
                  <p>
                    Your systemic health is closely linked to your ocular health. Conditions like diabetes and hypertension can directly impact your vision.
                  </p>
                  <p>
                    Sharing this information allows our optometrists to detect issues earlier and tailor treatments specifically to your body's needs.
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-8 bg-secondary/30 rounded-[2rem] border border-border/40 text-center"
            >
              <ShieldCheck className="h-8 w-8 text-primary/40 mx-auto mb-4" />
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                Your data is stored securely and is only accessible by NOVA Eye Care's authorized clinical staff.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Section({ icon: Icon, title, description, value, onChange, placeholder, variants }: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder: string;
  variants: import("framer-motion").Variants;
}) {
  return (
    <motion.div variants={variants} className="space-y-5 group">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-primary-soft text-primary rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl tracking-tight">{title}</h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{description}</p>
        </div>
      </div>
      <Textarea 
        placeholder={placeholder}
        className="rounded-[1.5rem] border-border/60 bg-white/50 focus:bg-white focus:ring-primary/20 min-h-[120px] text-base p-5 transition-all shadow-inner"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </motion.div>
  );
}

