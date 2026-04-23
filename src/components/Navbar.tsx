import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/dvla", label: "DVLA Test" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled 
          ? "border-b border-border/60 bg-background/90 backdrop-blur-xl py-2 shadow-sm" 
          : "bg-transparent py-4"
      }`}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.span 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground shadow-card group-hover:shadow-glow transition-shadow duration-500"
          >
            <Eye className="h-6 w-6" />
          </motion.span>
          <span className="text-lg md:text-xl font-bold tracking-tight">
            <span className="text-primary italic">NOVA</span> <span className="text-foreground">Eye Care</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1.5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 relative group ${
                  isActive ? "text-primary bg-primary-soft shadow-inner" : "text-foreground/75 hover:text-primary hover:bg-primary-soft"
                }`
              }
            >
              {l.label}
              <motion.div 
                className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full" 
                initial={{ width: 0 }}
                whileHover={{ width: "40%" }}
              />
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {session ? (
            <Button asChild variant="ghost" className="font-bold hover:bg-primary-soft text-foreground/80"><Link to="/dashboard">Dashboard</Link></Button>
          ) : (
            <Button asChild variant="ghost" className="font-bold hover:bg-primary-soft text-foreground/80"><Link to="/auth">Sign in</Link></Button>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild variant="hero" className="rounded-xl px-7 font-bold shadow-lg shadow-primary/20"><Link to="/book">Book Now</Link></Button>
          </motion.div>
        </div>

        <button
          className="lg:hidden p-2 rounded-xl hover:bg-primary-soft transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="h-6 w-6 text-primary" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Menu className="h-6 w-6 text-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.1 } }
              }}
              className="container py-6 flex flex-col gap-2"
            >
              {links.map((l) => (
                <motion.div key={l.to} variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    className={({ isActive }) =>
                      `px-4 py-3.5 text-base font-bold rounded-xl transition-all ${
                        isActive ? "text-primary bg-primary-soft shadow-inner" : "text-foreground/80 hover:bg-primary-soft"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="flex gap-3 pt-4">
                {session ? (
                  <Button asChild variant="outline" className="flex-1 rounded-xl h-12 font-bold"><Link to="/dashboard">Dashboard</Link></Button>
                ) : (
                  <Button asChild variant="outline" className="flex-1 rounded-xl h-12 font-bold"><Link to="/auth">Sign in</Link></Button>
                )}
                <Button asChild variant="hero" className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-primary/20"><Link to="/book">Book Now</Link></Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
