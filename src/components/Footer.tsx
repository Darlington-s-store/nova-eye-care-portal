import { Link } from "react-router-dom";
import { Eye, Mail, Phone, MapPin } from "lucide-react";
import { CLINIC } from "@/lib/clinic";

export const Footer = () => (
  <footer className="border-t border-border bg-secondary/40 mt-20">
    <div className="container py-12 grid gap-8 md:grid-cols-4">
      <div className="md:col-span-2">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary mb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-hero-gradient text-primary-foreground">
            <Eye className="h-5 w-5" />
          </span>
          <span>NOVA Eye Care Services</span>
        </Link>
        <p className="text-sm text-muted-foreground max-w-md">
          {CLINIC.tagline}. Professional optometry care in Ghana — comprehensive eye exams,
          contact lenses, vision therapy, low vision services, and DVLA testing.
        </p>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Quick Links</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/services" className="hover:text-primary transition-smooth">Services</Link></li>
          <li><Link to="/book" className="hover:text-primary transition-smooth">Book Appointment</Link></li>
          <li><Link to="/dvla" className="hover:text-primary transition-smooth">DVLA Eye Testing</Link></li>
          <li><Link to="/about" className="hover:text-primary transition-smooth">About Us</Link></li>
          <li><Link to="/contact" className="hover:text-primary transition-smooth">Contact</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Contact</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {CLINIC.phones.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <a href={`tel:${p}`} className="hover:text-primary transition-smooth">{p}</a>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <a href={`mailto:${CLINIC.email}`} className="hover:text-primary transition-smooth break-all">
              {CLINIC.email}
            </a>
          </li>
          <li className="flex items-start gap-2 pt-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <div>{CLINIC.hours.weekdays}</div>
              <div>{CLINIC.hours.saturday}</div>
              <div>{CLINIC.hours.sunday}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container py-4 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} NOVA Eye Care Services. All rights reserved.
      </div>
    </div>
  </footer>
);
