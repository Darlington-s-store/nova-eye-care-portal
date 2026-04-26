import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Save, 
  Loader2, 
  Layout, 
  Users, 
  Clock, 
  Phone, 
  Megaphone, 
  Eye, 
  Plus, 
  Trash2,
  Image as ImageIcon
} from "lucide-react";

type CMSSection = {
  section_key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content_json: any;
};

export default function AdminCMS() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sections, setSections] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchCMS();
  }, []);

  const fetchCMS = async () => {
    setFetching(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("cms_content")
      .select("*");
    
    if (error) {
      toast.error(error.message);
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cmsData: Record<string, any> = {};
      data.forEach((s: CMSSection) => {
        cmsData[s.section_key] = s.content_json;
      });
      setSections(cmsData);
    }
    setFetching(false);
  };

  const handleSave = async (key: string) => {
    setLoading(true);
    const content = sections[key];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("cms_content")
      .upsert({ 
        section_key: key, 
        content_json: content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'section_key' });

    if (error) toast.error(error.message);
    else toast.success(`${key.toUpperCase()} section updated successfully`);
    setLoading(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSection = (key: string, data: any) => {
    setSections(prev => ({ ...prev, [key]: data }));
  };

  if (fetching) {
    return (
      <AdminLayout title="CMS Management" subtitle="Loading website content settings...">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          <p className="font-medium animate-pulse">Syncing content repository...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Content Management" subtitle="Wysiwyg control over your public website landing pages.">
      <Tabs defaultValue="hero" className="space-y-8">
        <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-white/60 sticky top-0 z-10 shadow-sm">
          <TabsList className="bg-transparent gap-1">
            <TabsTrigger value="hero" className="rounded-xl gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Layout className="h-4 w-4" /> Hero
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-xl gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="h-4 w-4" /> Team
            </TabsTrigger>
            <TabsTrigger value="hours" className="rounded-xl gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Clock className="h-4 w-4" /> Hours
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-xl gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Phone className="h-4 w-4" /> Contact
            </TabsTrigger>
            <TabsTrigger value="news" className="rounded-xl gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Megaphone className="h-4 w-4" /> Announcements
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card className="p-8 shadow-elegant rounded-[2.5rem] border-0">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary italic font-serif">H</div>
                Hero Section Configuration
              </h2>
              <Button onClick={() => handleSave("hero")} disabled={loading} className="rounded-xl gap-2 px-8 font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
              </Button>
            </div>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Main Heading</label>
                <Input 
                  value={sections.hero?.heading || ""} 
                  onChange={(e) => updateSection("hero", { ...sections.hero, heading: e.target.value })}
                  placeholder="Advanced Eye Care for Everyone"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Sub-heading</label>
                <Textarea 
                  value={sections.hero?.subheading || ""} 
                  onChange={(e) => updateSection("hero", { ...sections.hero, subheading: e.target.value })}
                  rows={2}
                  placeholder="We combine expert care with precision technology..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">CTA Label 1 (Primary)</label>
                  <Input 
                    value={sections.hero?.cta1 || ""} 
                    onChange={(e) => updateSection("hero", { ...sections.hero, cta1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">CTA Label 2 (Secondary)</label>
                  <Input 
                    value={sections.hero?.cta2 || ""} 
                    onChange={(e) => updateSection("hero", { ...sections.hero, cta2: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Team Section */}
        <TabsContent value="team">
          <Card className="p-8 shadow-elegant rounded-[2.5rem] border-0">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Our Medical Experts</h2>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  const currentTeam = sections.team?.members || [];
                  updateSection("team", { ...sections.team, members: [...currentTeam, { name: "", title: "", bio: "", photo: "" }] });
                }} className="rounded-xl gap-2 border-primary/20 text-primary">
                  <Plus className="h-4 w-4" /> Add Member
                </Button>
                <Button onClick={() => handleSave("team")} disabled={loading} className="rounded-xl px-10 font-bold">
                  Save Team
                </Button>
              </div>
            </div>
            
            <div className="grid gap-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(sections.team?.members || []).map((m: any, idx: number) => (
                <div key={idx} className="p-6 bg-muted/30 rounded-[2rem] border border-muted relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -right-2 bg-white shadow-md text-destructive hover:bg-destructive hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all h-8 w-8"
                    onClick={() => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const newMembers = sections.team.members.filter((_: any, i: number) => i !== idx);
                      updateSection("team", { ...sections.team, members: newMembers });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid md:grid-cols-12 gap-6">
                    <div className="md:col-span-3 space-y-3">
                      <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center text-muted-foreground overflow-hidden border">
                        {m.photo ? <img src={m.photo} className="w-full h-full object-cover" /> : <ImageIcon className="h-8 w-8 opacity-20" />}
                      </div>
                      <Input 
                        placeholder="Photo URL" 
                        value={m.photo} 
                        className="text-xs"
                        onChange={(e) => {
                          const newMembers = [...sections.team.members];
                          newMembers[idx].photo = e.target.value;
                          updateSection("team", { ...sections.team, members: newMembers });
                        }}
                      />
                    </div>
                    <div className="md:col-span-9 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input 
                          placeholder="Full Name" 
                          value={m.name} 
                          onChange={(e) => {
                            const newMembers = [...sections.team.members];
                            newMembers[idx].name = e.target.value;
                            updateSection("team", { ...sections.team, members: newMembers });
                          }}
                        />
                        <Input 
                          placeholder="Title / Specialist" 
                          value={m.title} 
                          onChange={(e) => {
                            const newMembers = [...sections.team.members];
                            newMembers[idx].title = e.target.value;
                            updateSection("team", { ...sections.team, members: newMembers });
                          }}
                        />
                      </div>
                      <Textarea 
                        placeholder="Short professional biography..." 
                        rows={3} 
                        value={m.bio} 
                        onChange={(e) => {
                          const newMembers = [...sections.team.members];
                          newMembers[idx].bio = e.target.value;
                          updateSection("team", { ...sections.team, members: newMembers });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Working Hours */}
        <TabsContent value="hours">
          <Card className="p-8 shadow-elegant rounded-[2.5rem] border-0">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Standard Clinic Hours</h2>
              <Button onClick={() => handleSave("hours")} disabled={loading} className="rounded-xl px-10 font-bold">
                Save Hours
              </Button>
            </div>
            <div className="grid gap-4 max-w-2xl">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <div key={day} className="flex items-center gap-6 p-4 bg-white rounded-2xl border shadow-sm group">
                  <span className="w-32 font-bold">{day}</span>
                  <div className="flex-1 flex gap-3 items-center">
                    <Input 
                      placeholder="e.g. 08:30 AM" 
                      value={sections.hours?.[day] || ""} 
                      onChange={(e) => {
                        const newHours = { ...sections.hours, [day]: e.target.value };
                        updateSection("hours", newHours);
                      }}
                    />
                    <div className="h-0.5 w-4 bg-muted" />
                    <Input 
                      placeholder="e.g. 05:00 PM" 
                      value={sections.hours?.[day + '_to'] || ""} 
                      onChange={(e) => {
                        const newHours = { ...sections.hours, [day + '_to']: e.target.value };
                        updateSection("hours", newHours);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="news">
          <Card className="p-8 shadow-elegant rounded-[2.5rem] border-0">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Announcement Banner</h2>
              <Button onClick={() => handleSave("announcements")} disabled={loading} className="rounded-xl px-10 font-bold">
                Update Banner
              </Button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-bold">Show Banner</span>
                  <span className="text-xs text-muted-foreground italic">If enabled, this appears at the top of every page.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={sections.announcements?.enabled || false} 
                  onChange={(e) => updateSection("announcements", { ...sections.announcements, enabled: e.target.checked })}
                  className="h-6 w-6 accent-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Message Content</label>
                <Textarea 
                  value={sections.announcements?.message || ""} 
                  onChange={(e) => updateSection("announcements", { ...sections.announcements, message: e.target.value })}
                  placeholder="e.g. Due to public holiday, we are closed on Monday, 1st May."
                  rows={2}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

      </Tabs>
    </AdminLayout>
  );
}
