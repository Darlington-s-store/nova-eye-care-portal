import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SERVICES } from "@/lib/clinic";
import { motion } from "framer-motion";
import { Eye, CircleDot, Glasses, Sparkles, Building2, Users, Car, ArrowRight } from "lucide-react";
import heroServices from "@/assets/hero-services.jpg";
import generalEye from "@/assets/general-eye.jpg";
import contactLens from "@/assets/contact-lens-services.jpg";
import binocularVision from "@/assets/binocular-vision-services.jpg";
import lowVision from "@/assets/low-vision-rehabilitation.jpg";
import corporateEye from "@/assets/corporate-eye-health-services.jpg";
import publicEye from "@/assets/public-eye-health.jpg";
import dvlaImage from "@/assets/dvla-eye-testing.jpg";

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
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        {SERVICES.map((s) => {
          const sImage = SERVICE_IMAGES[s.slug] || s.image;
          return (
            <motion.div key={s.slug} variants={item}>
              <Card id={s.slug} className="p-0 overflow-hidden border-orange-50/10 hover:shadow-2xl transition-all duration-500 scroll-mt-24 group h-full flex flex-col rounded-[1.5rem] bg-white">
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img 
                    src={sImage} 
                    alt={s.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="p-8 flex flex-col flex-grow items-start">
                  <h2 className="font-bold text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors mb-3 tracking-tight">
                    {s.name}
                  </h2>
                  <p className="text-muted-foreground/80 mb-6 leading-relaxed text-sm md:text-base line-clamp-3 flex-grow">
                    {s.description}
                  </p>
                  <Link 
                    to={`/book?service=${s.slug}`} 
                    className="group/link flex items-center gap-2 text-primary font-bold text-sm hover:underline underline-offset-4"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
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
