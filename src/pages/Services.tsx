import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SERVICES } from "@/lib/clinic";
import { motion } from "framer-motion";
import { Eye, CircleDot, Glasses, Sparkles, Building2, Users, Car, ArrowRight } from "lucide-react";
import heroServices from "@/assets/hero-services.jpg";

const ICONS = { Eye, CircleDot, Glasses, Sparkles, Building2, Users, Car };

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Services = () => (
  <Layout>
    <PageHero
      image={heroServices}
      eyebrow="Our Expertise"
      title="Our Services"
      subtitle="From routine eye exams to specialty vision services, NOVA Eye Care provides comprehensive optometry care tailored to every patient."
    />

    <section className="container py-20 pb-32">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-8 lg:grid-cols-2"
      >
        {SERVICES.map((s) => {
          const Icon = ICONS[s.icon as keyof typeof ICONS];
          return (
            <motion.div key={s.slug} variants={item}>
              <Card id={s.slug} className="p-8 hover:shadow-elegant transition-all duration-500 scroll-mt-24 border-border/60 group h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h2 className="font-bold text-2xl text-foreground group-hover:text-primary transition-colors">{s.name}</h2>
                  </div>
                  <p className="text-muted-foreground mb-8 leading-relaxed text-lg">{s.description}</p>
                </div>
                <div>
                  <Button asChild variant="hero" size="lg" className="px-6 rounded-xl">
                    <Link to={`/book?service=${s.slug}`}>
                      Book This Service <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  </Layout>
);

export default Services;
