import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Loader2, Save, X, Image as ImageIcon, ArrowRight, LayoutGrid, List, Eye, Upload } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("services")
      .select("id, slug, name, short_description, full_description, image_url, display_order")
      .order("display_order", { ascending: true });
    
    if (error) toast.error(error.message);
    else setServices((data as Service[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug) {
      toast.error("Name and Slug are required");
      return;
    }

    setLoading(true);
    const { id, ...dataToSave } = editing;
    
    const { error } = isNew 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? await (supabase as any).from("services").insert([editing])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : await (supabase as any).from("services").update(dataToSave as never).eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isNew ? "Service created successfully" : "Service updated successfully");
      setEditing(null);
      setIsNew(false);
      fetchServices();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("services").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Service removed");
      fetchServices();
    }
  };

  return (
    <AdminLayout title="Services Management" subtitle="Dynamic control over NOVA's clinical treatments and packages.">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-muted p-1 rounded-xl">
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("list")}
              className="rounded-lg gap-2"
            >
              <List className="h-4 w-4" /> List
            </Button>
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("grid")}
              className="rounded-lg gap-2"
            >
              <LayoutGrid className="h-4 w-4" /> Cards
            </Button>
          </div>
          
          {!editing && (
            <Button onClick={() => { 
              setIsNew(true); 
              setEditing({ id: crypto.randomUUID(), slug: "", name: "", short_description: "", full_description: "", image_url: "https://images.unsplash.com/photo-1551232864-3f021f1d9316?q=80&w=800", display_order: services.length + 1 });
            }} className="gap-2 rounded-xl shadow-lg hover:shadow-primary/20 transition-all">
              <Plus className="h-4 w-4" /> New Service
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid lg:grid-cols-12 gap-8"
            >
              {/* Form Side */}
              <Card className="lg:col-span-7 p-8 shadow-elegant border-primary/10 rounded-[2rem]">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary hover:bg-primary/20 border-0">{isNew ? "Creative Mode" : "Update Mode"}</Badge>
                    <h2 className="text-2xl font-bold tracking-tight">{isNew ? "Design New Service" : "Refine Service Details"}</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(null); setIsNew(false); }} className="rounded-full">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="grid gap-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Service Title</label>
                      <Input 
                        value={editing.name} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditing({ 
                            ...editing, 
                            name: val,
                            slug: isNew ? val.toLowerCase().replace(/\s+/g, '-') : editing.slug
                          });
                        }}
                        placeholder="e.g. Laser Consultation"
                        className="h-12 rounded-xl border-border/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">URL Reference (Slug)</label>
                      <Input 
                        value={editing.slug} 
                        onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="e.g. laser-consultancy"
                        className="h-12 rounded-xl border-border/60"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1 flex justify-between items-center">
                        Banner Image
                        {uploading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input 
                            value={editing.image_url} 
                            onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                            placeholder="https://..."
                            className="h-12 rounded-xl border-border/60 pr-10"
                          />
                          <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
                        </div>
                        <div className="relative">
                          <Button 
                            variant="secondary" 
                            className="h-12 rounded-xl h-12 w-12 p-0" 
                            disabled={uploading}
                            asChild
                          >
                            <label className="cursor-pointer">
                              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  try {
                                    setUploading(true);
                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `${editing.slug || 'service'}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                                    const filePath = `${fileName}`;

                                    const { error: uploadError } = await supabase.storage
                                      .from('services')
                                      .upload(filePath, file);

                                    if (uploadError) throw uploadError;

                                    const { data: { publicUrl } } = supabase.storage
                                      .from('services')
                                      .getPublicUrl(filePath);

                                    setEditing({ ...editing, image_url: publicUrl });
                                    toast.success("Image uploaded successfully");
                                  } catch (error) {
                                    const message = error instanceof Error ? error.message : "An unexpected error occurred";
                                    toast.error(`Upload failed: ${message}`);
                                  } finally {
                                    setUploading(false);
                                  }
                                }} 
                              />
                            </label>
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Sort Priority</label>
                      <Input 
                        type="number"
                        value={editing.display_order} 
                        onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })}
                        className="h-12 rounded-xl border-border/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Elevator Pitch (Short Summary)</label>
                    <Input 
                      value={editing.short_description} 
                      onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
                      placeholder="Appears on cards..."
                      className="h-12 rounded-xl border-border/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Full Clinical Details</label>
                    <Textarea 
                      value={editing.full_description} 
                      onChange={(e) => setEditing({ ...editing, full_description: e.target.value })}
                      rows={6}
                      placeholder="Detailed explanation of the treatment..."
                      className="rounded-2xl border-border/60 p-4"
                    />
                  </div>
                </div>

                <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-muted">
                  <Button variant="outline" size="lg" onClick={() => { setEditing(null); setIsNew(false); }} className="rounded-xl px-8">Discard</Button>
                  <Button onClick={handleSave} size="lg" className="rounded-xl px-8 gap-2 bg-hero-gradient border-0 font-bold shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Service
                  </Button>
                </div>
              </Card>

              {/* Preview Side */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-2 mb-2 font-bold text-muted-foreground uppercase text-xs tracking-widest pl-2">
                  <Eye className="h-3 w-3" /> Live card preview
                </div>
                <Card className="p-0 overflow-hidden border-orange-50/10 shadow-2xl transition-all duration-500 group rounded-[1.5rem] bg-white opacity-90 grayscale-[0.2] pointer-events-none border-dashed border-2">
                  <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                    {editing.image_url ? (
                      <img 
                        src={editing.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8 opacity-20" /></div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col items-start bg-white">
                    <h2 className="font-bold text-xl md:text-2xl text-foreground mb-3 tracking-tight">
                      {editing.name || "Service Title..."}
                    </h2>
                    <p className="text-muted-foreground/80 mb-6 leading-relaxed text-sm line-clamp-3">
                      {editing.short_description || "A captivating description will appear here..."}
                    </p>
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      Book this service
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
                <div className="p-6 bg-info-soft rounded-2xl border border-info/10">
                  <p className="text-xs leading-relaxed text-muted-foreground italic">
                    <strong>Tip:</strong> Sorter priority determines where this service appears in the grid. Lower numbers appear first. Use descriptive names for better SEO performance.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}
            >
              {loading ? (
                <div className="py-20 col-span-full flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                  <p className="text-sm font-medium animate-pulse">Syncing clinical services...</p>
                </div>
              ) : services.length === 0 ? (
                <Card className="py-32 col-span-full text-center border-dashed border-2 rounded-[2rem] bg-muted/20">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                    <LayoutGrid className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">No clinical services found</h3>
                  <p className="text-muted-foreground mb-8">Start by defining NOVA's first premium treatment.</p>
                  <Button onClick={() => { setIsNew(true); setEditing({ id: crypto.randomUUID(), slug: "", name: "", short_description: "", full_description: "", image_url: "", display_order: 1 }); }} variant="outline" className="rounded-xl">Create your first service</Button>
                </Card>
              ) : (
                services.map((s) => (
                  <motion.div 
                    layout
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {viewMode === "list" ? (
                      <Card className="p-4 hover:shadow-elegant transition-all group border-border/40 hover:border-primary/20 rounded-2xl">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="h-20 w-32 shrink-0 rounded-xl bg-muted overflow-hidden border border-border/10 shadow-sm relative">
                            <img 
                              src={s.image_url} 
                              alt={s.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                            />
                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md border border-white/20 font-bold">#{s.display_order}</div>
                          </div>
                          <div className="flex-1 min-w-0 text-center sm:text-left">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{s.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1 truncate">{s.short_description}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="icon" onClick={() => setEditing(s)} className="rounded-xl hover:bg-primary-soft hover:text-primary transition-colors border-border/60 h-10 w-10">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="rounded-xl text-destructive hover:bg-destructive/10 transition-colors h-10 w-10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card className="p-0 overflow-hidden border-border/40 hover:shadow-elegant transition-all group flex flex-col h-full rounded-2xl relative">
                        <div className="aspect-video relative overflow-hidden">
                          <img 
                            src={s.image_url} 
                            alt={s.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                          />
                          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 font-bold">#{s.display_order}</div>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{s.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-grow">{s.short_description}</p>
                          <div className="flex gap-2 mt-6 pt-4 border-t border-muted">
                            <Button variant="outline" onClick={() => setEditing(s)} className="flex-1 rounded-lg gap-2 h-9 text-xs font-bold border-border/60">
                              <Edit2 className="h-3.5 w-3.5" /> Details
                            </Button>
                            <Button variant="ghost" onClick={() => handleDelete(s.id)} className="h-9 w-9 p-0 rounded-lg text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
