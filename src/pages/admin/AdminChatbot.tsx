import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, BookOpen, Save } from "lucide-react";

type KB = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  active: boolean;
  updated_at: string;
};

const AdminChatbot = () => {
  const [items, setItems] = useState<KB[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<KB> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("chatbot_knowledge").select("*").order("updated_at", { ascending: false });
    setItems((data as KB[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.question || !editing?.answer) { toast.error("Question and answer are required"); return; }
    setSaving(true);
    if (editing.id) {
      const { error } = await supabase.from("chatbot_knowledge").update({
        question: editing.question, answer: editing.answer,
        category: editing.category ?? null, active: editing.active ?? true,
      }).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("chatbot_knowledge").insert({
        question: editing.question, answer: editing.answer,
        category: editing.category ?? null, active: editing.active ?? true,
      });
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    toast.success("Saved");
    setEditing(null);
    setSaving(false);
    load();
  };

  const toggle = async (kb: KB) => {
    await supabase.from("chatbot_knowledge").update({ active: !kb.active }).eq("id", kb.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry? The chatbot will no longer use it.")) return;
    await supabase.from("chatbot_knowledge").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  return (
    <AdminLayout title="Chatbot Knowledge Base" subtitle="Train the assistant by adding question/answer pairs it will use to reply.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <h2 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> {items.length} entries</h2>
            <Button size="sm" variant="hero" onClick={() => setEditing({ question: "", answer: "", category: "", active: true })}>
              <Plus className="h-4 w-4" /> Add entry
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">No entries yet — add one to start training the bot.</Card>
          ) : (
            items.map((kb) => (
              <Card key={kb.id} className={`p-4 ${!kb.active ? "opacity-60" : ""}`}>
                <div className="flex justify-between gap-3 items-start mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{kb.question}</p>
                      {kb.category && <Badge variant="secondary">{kb.category}</Badge>}
                      {!kb.active && <Badge variant="outline">disabled</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{kb.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Switch checked={kb.active} onCheckedChange={() => toggle(kb)} />
                    <Button size="icon" variant="ghost" onClick={() => setEditing(kb)} aria-label="Edit"><Save className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(kb.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card className="p-5 sticky top-20 shadow-card">
            <h3 className="font-semibold mb-4">{editing?.id ? "Edit entry" : editing ? "New entry" : "Editor"}</h3>
            {!editing ? (
              <p className="text-sm text-muted-foreground">Select an entry or click "Add entry" to start.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="q">Question / topic</Label>
                  <Input id="q" value={editing.question ?? ""} onChange={(e) => setEditing({ ...editing, question: e.target.value })} className="mt-1.5" placeholder="e.g. Do you accept walk-ins?" />
                </div>
                <div>
                  <Label htmlFor="a">Answer</Label>
                  <Textarea id="a" value={editing.answer ?? ""} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} rows={5} className="mt-1.5" placeholder="The answer the chatbot should give..." />
                </div>
                <div>
                  <Label htmlFor="cat">Category (optional)</Label>
                  <Input id="cat" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="mt-1.5" placeholder="hours, services, pricing..." />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                  <Label>Active</Label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={save} variant="hero" className="flex-1" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChatbot;
