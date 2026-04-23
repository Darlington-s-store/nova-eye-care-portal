import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Award, Heart, Microscope, Eye } from "lucide-react";
import heroAbout from "@/assets/hero-about.jpg";

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
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

const About = () => (
  <Layout>
    <PageHero
      image={heroAbout}
      eyebrow="Who We Are"
      title="About NOVA Eye Care"
      subtitle="Compassionate, expert optometry care — committed to helping every Ghanaian see better and live brighter."
    />

    <section className="container py-20 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold mb-6 tracking-tight">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed mb-16 text-lg">
          At NOVA Eye Care Services, we believe great vision changes lives. Our mission is to make
          high-quality eye care accessible across Ghana through patient-centred service, modern
          technology, and community outreach. From a child's first eye exam to specialty low-vision
          rehabilitation, every patient receives the same standard of attention and respect.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold mb-8 tracking-tight">What sets us apart</h2>
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2"
        >
          {[
            { icon: Award, title: "Qualified Specialists", text: "Licensed optometrists with years of clinical experience." },
            { icon: Microscope, title: "Modern Equipment", text: "Up-to-date diagnostic technology for accurate, fast results." },
            { icon: Heart, title: "Personalized Care", text: "Treatment plans tailored to each patient's lifestyle and needs." },
            { icon: Eye, title: "Full Spectrum of Services", text: "From routine exams to vision therapy, low vision, and DVLA testing." },
          ].map((p) => (
            <motion.div key={p.title} variants={item} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="p-8 h-full shadow-card hover:shadow-elegant transition-shadow duration-500 border-border/60">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-6 shadow-sm">
                  <p.icon className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-xl mb-3">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.text}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  </Layout>
);

export default About;
