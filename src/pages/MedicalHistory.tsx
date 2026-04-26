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
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";

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

  useEffect(() => {
    if (user) fetchHistory();
  }, [user, fetchHistory]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("patient_medical_history") as any)
      .select("*")
      .eq("patient_id", user.id)
      .maybeSingle();

    if (error) {
      toast.error("Could not load medical history");
    } else if (data) {
      setHistory({
        ocular_history: data.ocular_history || "",
        systemic_conditions: data.systemic_conditions || "",
        current_medications: data.current_medications || "",
        family_eye_history: data.family_eye_history || "",
        allergies: data.allergies || "",
      });
    }
    setFetching(false);
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("patient_medical_history") as any).upsert({
      patient_id: user.id,
      ...history,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'patient_id' });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Medical history updated successfully");
    }
    setLoading(false);
  };

  if (fetching) {
    return (
      <Layout>
        <div className="container py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          <p className="font-medium animate-pulse">Consulting health records...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-primary-soft border-b border-primary/10">
        <div className="container py-12">
          <Button asChild variant="ghost" className="mb-6 rounded-xl hover:bg-white/50">
            <Link to="/dashboard" className="gap-2"><ChevronLeft className="h-4 w-4" /> Back to Dashboard</Link>
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Medical History</h1>
              <p className="text-muted-foreground max-w-xl">
                Keep your ocular and systemic health information up to date to help our specialists provide precise care.
              </p>
            </div>
            <Button onClick={handleSave} disabled={loading} size="lg" className="rounded-2xl px-10 font-bold gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Save Health Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-16">
        <div className="grid gap-10 lg:grid-cols-12 max-w-6xl mx-auto">
          {/* Main Form */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="p-8 rounded-[2.5rem] border-0 shadow-elegant overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="space-y-8 relative z-10">
                
                <Section 
                  icon={History} 
                  title="Ocular History" 
                  description="Details of previous eye surgeries, trauma, or diagnosed eye conditions."
                  value={history.ocular_history}
                  onChange={(v) => setHistory({...history, ocular_history: v})}
                  placeholder="e.g. Previous laser surgery in 2018, history of glaucoma in right eye..."
                />

                <Section 
                  icon={Stethoscope} 
                  title="Systemic Conditions" 
                  description="Chronic health issues such as diabetes, hypertension, or heart disease."
                  value={history.systemic_conditions}
                  onChange={(v) => setHistory({...history, systemic_conditions: v})}
                  placeholder="e.g. Type 2 Diabetes for 5 years, Hypertension well-managed..."
                />

                <Section 
                  icon={Pill} 
                  title="Current Medications" 
                  description="List any eye drops or systemic prescriptions you are currently taking."
                  value={history.current_medications}
                  onChange={(v) => setHistory({...history, current_medications: v})}
                  placeholder="e.g. Metformin 500mg, Timolol eye drops (Daily)..."
                />

                <Section 
                  icon={AlertCircle} 
                  title="Allergies" 
                  description="Drug allergies or sensitivities, especially to anaesthetics or iodine."
                  value={history.allergies}
                  onChange={(v) => setHistory({...history, allergies: v})}
                  placeholder="e.g. Penicillin, specific preservative in eye drops..."
                />

                <Section 
                  icon={Users2} 
                  title="Family Eye History" 
                  description="Known vision problems in your immediate family (parents/siblings)."
                  value={history.family_eye_history}
                  onChange={(v) => setHistory({...history, family_eye_history: v})}
                  placeholder="e.g. Father has macular degeneration, Sister has early onset cataracts..."
                />

              </div>
            </Card>
          </div>

          {/* Sidebar / Info */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 bg-hero-gradient text-white rounded-[2rem] shadow-glow border-0">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> Why this matters
              </h3>
              <p className="text-sm opacity-90 leading-relaxed space-y-4">
                Your systemic health is closely linked to your ocular health. Conditions like diabetes and hypertension can directly impact your vision.
                <br /><br />
                Sharing this information allows our optometrists to detect issues earlier and tailor treatments specifically to your body's needs.
              </p>
            </Card>

            <div className="p-6 bg-muted/40 rounded-2xl border border-muted-foreground/10">
              <p className="text-xs text-muted-foreground italic text-center">
                Your data is stored securely and is only accessible by Nova Eye Care's clinical staff.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Section({ icon: Icon, title, description, value, onChange, placeholder }: { icon: React.ElementType; title: string; description: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-4 group">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-primary-soft text-primary rounded-xl flex items-center justify-center transition-transform group-focus-within:scale-110">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{description}</p>
        </div>
      </div>
      <Textarea 
        placeholder={placeholder}
        className="rounded-2xl border-border/40 focus:ring-primary/20 min-h-[100px] text-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
