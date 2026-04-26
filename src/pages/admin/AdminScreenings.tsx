import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { generateScreeningPDF } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { 
  Eye, 
  Plus, 
  Search, 
  FileText, 
  Download, 
  CheckCircle2, 
  User, 
  Loader2,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Screening = {
  id: string;
  patient_id: string;
  screening_date: string;
  diagnosis: string;
  va_right_eye: string;
  va_left_eye: string;
  iop_right: number;
  iop_left: number;
  recommended_followup: string;
  is_visible_to_patient: boolean;
  profiles: {
    full_name: string;
  };
};

export default function AdminScreenings() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  // New Screening State
  const [newScreening, setNewScreening] = useState({
    patient_id: "",
    va_right_eye: "",
    va_left_eye: "",
    iop_right: "",
    iop_left: "",
    colour_vision_result: "",
    diagnosis: "",
    recommended_followup: "",
    is_visible_to_patient: true
  });

  const [patients, setPatients] = useState<{id: string, full_name: string}[]>([]);

  useEffect(() => {
    fetchScreenings();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from("profiles").select("id, full_name").eq("role", "patient");
    if (data) setPatients(data);
  };

  const fetchScreenings = async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("eye_screenings")
      .select("*, profiles!patient_id(full_name)")
      .order("created_at", { ascending: false });

    if (error) toast.error(error.message);
    else setScreenings(data || []);
    setLoading(false);
  };

  const handleCreateScreening = async () => {
    if (!newScreening.patient_id) {
      toast.error("Please select a patient first");
      return;
    }

    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("eye_screenings").insert([{
      ...newScreening,
      iop_right: parseFloat(newScreening.iop_right) || 0,
      iop_left: parseFloat(newScreening.iop_left) || 0,
      screening_date: new Date().toISOString().split('T')[0]
    }]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Health screening record saved successfully");
      setIsRecording(false);
      fetchScreenings();
    }
    setLoading(false);
  };

  return (
    <AdminLayout title="Eye Screenings" subtitle="Clinical diagnostics and patient health recording.">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96 group">
            <Input 
              placeholder="Search by patient name or diagnosis..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-border/40 shadow-sm focus:ring-primary/20"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 group-focus-within:text-primary transition-colors" />
          </div>

          <Dialog open={isRecording} onOpenChange={setIsRecording}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2 px-6 h-11 font-bold shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> New Diagnosis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2rem] p-8 border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Eye className="h-5 w-5" /></div>
                  New Eye Screening Record
                </DialogTitle>
                <DialogDescription className="text-muted-foreground italic">Enter clinical findings for the patient's current visit.</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 mt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Patient Selection</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-border/40 bg-muted/30 px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    value={newScreening.patient_id}
                    onChange={(e) => setNewScreening({...newScreening, patient_id: e.target.value})}
                  >
                    <option value="">Choose a registered patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 p-4 bg-muted/20 rounded-2xl border border-muted/50">
                    <h3 className="text-xs font-bold text-primary uppercase">Right Eye (OD)</h3>
                    <Input placeholder="Visual Acuity (e.g. 6/6)" value={newScreening.va_right_eye} onChange={e => setNewScreening({...newScreening, va_right_eye: e.target.value})} className="bg-white border-0 shadow-sm rounded-lg" />
                    <Input placeholder="IOP (mmHg)" type="number" value={newScreening.iop_right} onChange={e => setNewScreening({...newScreening, iop_right: e.target.value})} className="bg-white border-0 shadow-sm rounded-lg" />
                  </div>
                  <div className="space-y-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <h3 className="text-xs font-bold text-primary uppercase">Left Eye (OS)</h3>
                    <Input placeholder="Visual Acuity (e.g. 6/9)" value={newScreening.va_left_eye} onChange={e => setNewScreening({...newScreening, va_left_eye: e.target.value})} className="bg-white border-0 shadow-sm rounded-lg" />
                    <Input placeholder="IOP (mmHg)" type="number" value={newScreening.iop_left} onChange={e => setNewScreening({...newScreening, iop_left: e.target.value})} className="bg-white border-0 shadow-sm rounded-lg" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Clinical Assessment</label>
                  <Textarea placeholder="Diagnosis & Impression..." rows={3} value={newScreening.diagnosis} onChange={e => setNewScreening({...newScreening, diagnosis: e.target.value})} className="rounded-xl border-border/40" />
                  <Textarea placeholder="Recommended Follow-up..." rows={2} value={newScreening.recommended_followup} onChange={e => setNewScreening({...newScreening, recommended_followup: e.target.value})} className="rounded-xl border-border/40" />
                </div>
              </div>

              <DialogFooter className="mt-8">
                <Button variant="ghost" onClick={() => setIsRecording(false)} className="rounded-xl">Discard</Button>
                <Button onClick={handleCreateScreening} disabled={loading} className="rounded-xl px-8 font-bold gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save Medical Record
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Screening Table */}
        <Card className="rounded-[2.5rem] border-0 shadow-elegant overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
              <p className="text-sm font-medium animate-pulse">Consulting medical database...</p>
            </div>
          ) : screenings.length === 0 ? (
            <div className="p-20 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground"><Eye className="h-8 w-8" /></div>
              <h3 className="font-bold text-lg">No screening records yet</h3>
              <p className="text-muted-foreground">Clinical history will appear here once examinations are performed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b border-muted">
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Diagnosis</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">V.A (OD/OS)</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Visibility</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/40">
                  {screenings.filter(s => 
                    s.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((s) => (
                    <tr key={s.id} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs"><User className="h-4 w-4" /></div>
                          <span className="font-bold text-foreground">{s.profiles.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-muted-foreground">{new Date(s.screening_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium line-clamp-1">{s.diagnosis || "No diagnosis recorded"}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-muted/50 border-0">{s.va_right_eye || '-'}</Badge>
                          <Badge variant="outline" className="bg-muted/50 border-0">{s.va_left_eye || '-'}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge className={`${s.is_visible_to_patient ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'} border-0 px-3`}>
                          {s.is_visible_to_patient ? 'Patient Visible' : 'Internal Only'}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => generateScreeningPDF({
                              patient_name: s.profiles.full_name,
                              screening_date: s.screening_date,
                              va_right: s.va_right_eye,
                              va_left: s.va_left_eye,
                              iop_right: s.iop_right,
                              iop_left: s.iop_left,
                              diagnosis: s.diagnosis,
                              followup: s.recommended_followup
                            })}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"><FileText className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
