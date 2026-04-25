import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Loader2, Save, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type Service = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  full_description: string;
  image_url: string;
  display_order: number;
};

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services" as any)
      .select("*")
      .order("display_order", { ascending: true });
    
    if (error) toast.error(error.message);
    else setServices(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug) {
      toast.error("Name and Slug are required");
      return;
    }

    setLoading(true);
    const { error } = isNew 
      ? await supabase.from("services" as any).insert([editing])
      : await supabase.from("services" as any).update(editing).eq("id", editing.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isNew ? "Service created" : "Service updated");
      setEditing(null);
      setIsNew(false);
      fetchServices();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const { error } = await supabase.from("services" as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Service deleted");
      fetchServices();
    }
  };

  return (
    <AdminLayout title="Clinic Services" subtitle="Manage the treatments and packages offered by NOVA.">
      <div className="space-y-6">
        <div className="flex justify-end">
          {!editing && (
            <Button onClick={() => { 
              setIsNew(true); 
              setEditing({ id: "", slug: "", name: "", short_description: "", full_description: "", image_url: "/placeholder.svg", display_order: services.length + 1 });
            }} className="gap-2">
              <Plus className="h-4 w-4" /> Add New Service
            </Button>
          )}
        </div>

        {editing ? (
          <Card className="p-6 shadow-elegant border-primary/10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{isNew ? "New Service" : "Edit Service"}</h2>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setIsNew(false); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Service Name</label>
                  <Input 
                    value={editing.name} 
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="e.g. Pediatric Eye Care"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">URL Slug (lowercase, no spaces)</label>
                  <Input 
                    value={editing.slug} 
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="e.g. pediatric-care"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Display Order</label>
                  <Input 
                    type="number"
                    value={editing.display_order} 
                    onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Image Path/URL</label>
                  <div className="flex gap-2">
                    <Input 
                      value={editing.image_url} 
                      onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                    />
                    <div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden border">
                      {editing.image_url ? <img src={editing.image_url} alt="Preview" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Short Description (for cards)</label>
                  <Input 
                    value={editing.short_description} 
                    onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
                    placeholder="Brief summary..."
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold mb-1.5 block">Full Description (for details page)</label>
                <Textarea 
                  value={editing.full_description} 
                  onChange={(e) => setEditing({ ...editing, full_description: e.target.value })}
                  rows={4}
                  placeholder="Comprehensive explanation of the service..."
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</Button>
              <Button onClick={handleSave} className="gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : services.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <p className="text-muted-foreground">No services found. Add one above.</p>
              </Card>
            ) : (
              services.map((s) => (
                <Card key={s.id} className="p-5 hover:shadow-md transition-all group">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="h-20 w-32 shrink-0 rounded-xl bg-muted overflow-hidden border border-border/10 shadow-sm relative">
                      <img 
                        src={s.image_url} 
                        alt={s.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                      />
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 rounded-full backdrop-blur">#{s.display_order}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{s.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 truncate">{s.short_description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setEditing(s)} className="gap-2">
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive hover:bg-destructive/5 gap-2">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
