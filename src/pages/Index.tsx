import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SERVICES, CLINIC } from "@/lib/clinic";
import { getCMSContent, HeroContent, Announcements } from "@/lib/cms";
import { ApprovedReviews } from "@/components/ApprovedReviews";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye, CircleDot, Glasses, Sparkles, Building2, Users, Car,
  Clock, Award, HeartHandshake, Microscope, ArrowRight, CalendarCheck, Phone,
} from "lucide-react";
import heroHome from "@/assets/hero-home.jpg";
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

const trustPoints = [
  { icon: Award, title: "Qualified Specialists", text: "Licensed optometrists with years of clinical experience." },
  { icon: Microscope, title: "Modern Equipment", text: "Advanced diagnostic technology for precise results." },
  { icon: HeartHandshake, title: "Personalized Care", text: "Tailored treatment plans for every patient's needs." },
  { icon: Clock, title: "Flexible Hours", text: "Weekday and Saturday appointments to fit your schedule." },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

const Home = () => {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [announcement, setAnnouncement] = useState<Announcements | null>(null);
  const [hours, setHours] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      const heroData = await getCMSContent("hero");
      const newsData = await getCMSContent("announcements");
      const hoursData = await getCMSContent("hours");
      if (heroData) setHero(heroData);
      if (newsData) setAnnouncement(newsData);
      if (hoursData) setHours(hoursData);
    };
    fetchContent();
  }, []);

  return (
    <Layout>
      {/* Announcement Banner */}
      {announcement?.enabled && (
        <div className="bg-primary text-white py-3 px-4 text-center text-sm font-bold animate-in slide-in-from-top duration-700 relative z-50 shadow-lg">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse" />
            {announcement.message}
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden text-primary-foreground min-h-[85vh] flex items-center">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroHome})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-hero-gradient opacity-80" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" aria-hidden />
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="container relative py-20 md:py-32">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.span variants={itemVariants} className="inline-block px-4 py-1.5 text-[10px] font-bold rounded-full bg-white/10 backdrop-blur-md mb-8 tracking-[0.3em] uppercase border border-white/20">
              Transforming Vision · Nova Eye Care
            </motion.span>
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-8xl font-black leading-[1] mb-8 drop-shadow-xl text-balance">
              {hero?.heading || CLINIC.name}
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl md:text-2xl font-medium mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
              {hero?.subheading || "Comprehensive eye care for every stage of life — from routine exams to specialty vision services and DVLA testing."}
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-wrap gap-5 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-primary hover:text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] px-10 py-8 text-xl rounded-2xl transition-all duration-500 overflow-hidden relative group">
                <Link to="/book" className="flex items-center font-bold">
                  <CalendarCheck className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" /> 
                  {hero?.cta1 || "Book Appointment"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/5 backdrop-blur-xl border-white/30 text-white hover:bg-white/10 px-10 py-8 text-xl rounded-2xl font-bold transition-all duration-500">
                <Link to="/services" className="flex items-center">
                  {hero?.cta2 || "Our Services"} <ArrowRight className="h-5 w-5 ml-3" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Working hours bar */}
      <section className="bg-primary-soft border-y border-primary/10 overflow-hidden relative group">
        <div className="absolute inset-0 bg-primary/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out opacity-20" />
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="container py-5 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs text-primary font-black uppercase tracking-widest"
        >
          <span className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 opacity-40" /> 
            Mon - Fri: {hours?.Monday || CLINIC.hours.weekdays} {hours?.Monday_to ? `- ${hours.Monday_to}` : ''}
          </span>
          <span className="hidden md:inline opacity-10 text-xl font-thin">|</span>
          <span className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 opacity-40" /> 
            Sat: {hours?.Saturday || CLINIC.hours.saturday} {hours?.Saturday_to ? `- ${hours.Saturday_to}` : ''}
          </span>
          <span className="hidden md:inline opacity-10 text-xl font-thin">|</span>
          <a href={`tel:${CLINIC.phones[0]}`} className="flex items-center gap-2.5 group/phone hover:text-primary-dark transition-colors">
            <Phone className="h-4 w-4 opacity-40 group-hover/phone:rotate-12 transition-transform" /> 
            Emergency: {CLINIC.phones[0]}
          </a>
        </motion.div>
      </section>

    {/* Services overview */}
    <section className="container py-20 md:py-28">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-2xl mx-auto"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Our Services</h2>
        <p className="text-muted-foreground text-lg">
          Complete optometry care delivered by qualified professionals using modern equipment.
        </p>
      </motion.div>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {SERVICES.map((s) => {
          const sImage = SERVICE_IMAGES[s.slug] || s.image;
          return (
            <motion.div key={s.slug} variants={itemVariants}>
              <Link to="/services" className="group block h-full">
                <Card className="h-full hover:shadow-elegant transition-all duration-500 border-border/60 group-hover:border-primary/20 relative overflow-hidden flex flex-col rounded-3xl">
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={sImage} 
                      alt={s.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors line-clamp-1">{s.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1 line-clamp-2">{s.short}</p>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm text-primary font-bold">
                        Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>

    {/* Why choose us */}
    <section className="bg-soft-gradient relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="container relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Why Choose Us</h2>
          <p className="text-muted-foreground text-lg">
            Trusted by patients across Ghana for compassionate, expert eye care.
          </p>
        </motion.div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {trustPoints.map((t) => (
            <motion.div key={t.title} variants={itemVariants}>
              <div className="text-center p-8 rounded-3xl bg-card shadow-card hover:shadow-elegant transition-all duration-500 group">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-hero-gradient text-primary-foreground mb-6 transform group-hover:rotate-6 transition-transform shadow-lg">
                  <t.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Reviews */}
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <ApprovedReviews />
    </motion.div>

    {/* CTA */}
    <section className="container py-20 md:py-28">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-hero-gradient rounded-[2.5rem] p-10 md:p-20 text-center text-primary-foreground shadow-elegant relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-6xl font-bold mb-6 tracking-tight">Ready to see clearly?</h2>
          <p className="text-lg md:text-xl opacity-90 mb-10 max-w-xl mx-auto font-light leading-relaxed">
            Book your appointment today and experience the NOVA difference with our expert care.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 px-10 py-8 text-xl rounded-2xl shadow-glow">
            <Link to="/book"><CalendarCheck className="h-6 w-6 mr-2" /> Book an Appointment</Link>
          </Button>
        </div>
      </motion.div>
    </section>
    </Layout>
  );
};

export default Home;
