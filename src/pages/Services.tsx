import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SERVICES } from "@/lib/clinic";
import { motion } from "framer-motion";
import { Eye, CircleDot, Glasses, Sparkles, Building2, Users, Car, ArrowRight } from "lucide-react";
import heroServices from "@/assets/hero-services.jpg";
import generalEye from "@/assets/General Eye.jpg";
import contactLens from "@/assets/Contact Lens Services.jpg";
import binocularVision from "@/assets/Binocular Vision Services.jpg";
import lowVision from "@/assets/Low Vision and Vision Rehabilitation.jpg";
import corporateEye from "@/assets/Corporate Eye Health Services.jpg";
import publicEye from "@/assets/Public Eye Health Surveillance and Research.jpg";
import dvlaImage from "@/assets/DVLA Eye Testing.jpg";

const SERVICE_IMAGES: Record<string, string> = {
  "general-eye-health": generalEye,
  "contact-lens": contactLens,
  "binocular-vision": binocularVision,
  "low-vision": lowVision,
  "corporate-eye-health": corporateEye,
  "public-eye-health": publicEye,
  "dvla": dvlaImage,
};

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
          const sImage = SERVICE_IMAGES[s.slug] || s.image;
          return (
            <motion.div key={s.slug} variants={item}>
              <Card id={s.slug} className="p-0 overflow-hidden hover:shadow-elegant transition-all duration-500 scroll-mt-24 border-border/60 group h-full flex flex-col md:flex-row rounded-[2rem]">
                <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden">
                  <img 
                    src={sImage} 
                    alt={s.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                  />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="p-8 md:p-10 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <h2 className="font-bold text-2xl text-foreground group-hover:text-primary transition-colors mb-4 tracking-tight">{s.name}</h2>
                    <p className="text-muted-foreground mb-8 leading-relaxed text-base md:text-lg">{s.description}</p>
                  </div>
                  <div>
                    <Button asChild variant="hero" size="lg" className="px-8 rounded-xl font-bold">
                      <Link to={`/book?service=${s.slug}`}>Book this service</Link>
                    </Button>
                  </div>
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
