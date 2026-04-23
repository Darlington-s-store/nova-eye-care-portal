import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { notifyUser } from "@/lib/notify";
import { toast } from "sonner";
import { Loader2, Star, Check, X, Trash2 } from "lucide-react";

type Review = {
  id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  content: string;
  approved: boolean;
  created_at: string;
};

const AdminReviews = () => {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    setItems((data as Review[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (r: Review) => {
    const { error } = await supabase.from("reviews").update({ approved: true }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    if (r.user_id) {
      await notifyUser(r.user_id, {
        title: "Your review is live!",
        body: "Thanks for sharing your experience. Your review now appears on the homepage.",
        link: "/reviews",
      });
    }
    toast.success("Review approved");
    load();
  };

  const unapprove = async (r: Review) => {
    await supabase.from("reviews").update({ approved: false }).eq("id", r.id);
    toast.success("Review hidden");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  const pending = items.filter((r) => !r.approved);
  const approved = items.filter((r) => r.approved);

  return (
    <AdminLayout title="Reviews" subtitle="Approve, hide, or remove patient reviews.">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <h2 className="font-semibold text-lg mb-3">Pending approval ({pending.length})</h2>
          {pending.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground mb-8">Nothing waiting for review.</Card>
          ) : (
            <div className="space-y-3 mb-10">
              {pending.map((r) => <ReviewCard key={r.id} r={r} onApprove={approve} onRemove={remove} />)}
            </div>
          )}

          <h2 className="font-semibold text-lg mb-3">Published ({approved.length})</h2>
          {approved.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">No published reviews yet.</Card>
          ) : (
            <div className="space-y-3">
              {approved.map((r) => <ReviewCard key={r.id} r={r} approved onUnapprove={unapprove} onRemove={remove} />)}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

const ReviewCard = ({ r, approved, onApprove, onUnapprove, onRemove }: {
  r: Review; approved?: boolean;
  onApprove?: (r: Review) => void;
  onUnapprove?: (r: Review) => void;
  onRemove: (id: string) => void;
}) => (
  <Card className="p-5">
    <div className="flex flex-wrap justify-between gap-4 items-start">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold">{r.author_name}</p>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
            ))}
          </div>
          {approved && <Badge variant="secondary" className="bg-green-100 text-green-900">Published</Badge>}
        </div>
        <p className="text-sm text-foreground/85 mb-1">{r.content}</p>
        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-GB")}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        {!approved && onApprove && <Button size="sm" variant="hero" onClick={() => onApprove(r)}><Check className="h-4 w-4" /> Approve</Button>}
        {approved && onUnapprove && <Button size="sm" variant="outline" onClick={() => onUnapprove(r)}><X className="h-4 w-4" /> Unpublish</Button>}
        <Button size="sm" variant="outline" className="text-destructive" onClick={() => onRemove(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  </Card>
);

export default AdminReviews;
