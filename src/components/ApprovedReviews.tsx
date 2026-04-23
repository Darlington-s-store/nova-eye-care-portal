import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  content: string;
  created_at: string;
};

export const ApprovedReviews = () => {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, author_name, rating, content, created_at")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      setItems((data as Review[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <section className="container py-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="container py-16 md:py-20">
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">What our patients say</h2>
        <p className="text-muted-foreground">
          Real experiences from people we've cared for.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <Card key={r.id} className="p-6 shadow-card relative hover:shadow-elegant transition-smooth">
            <Quote className="absolute top-4 right-4 h-7 w-7 text-primary/15" />
            <div className="flex gap-0.5 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <p className="text-sm text-foreground/85 mb-4 leading-relaxed line-clamp-5">"{r.content}"</p>
            <div className="text-xs">
              <p className="font-semibold text-foreground">{r.author_name}</p>
              <p className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="text-center mt-8">
        <Button asChild variant="outline">
          <Link to="/reviews">Read all reviews <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
};
