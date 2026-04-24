import { ReactNode } from "react";

interface PageHeroProps {
  image: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
  align?: "left" | "center";
  size?: "md" | "lg";
}

export const PageHero = ({
  image, eyebrow, title, subtitle, children,
  align = "center", size = "md",
}: PageHeroProps) => {
  const padding = size === "lg" ? "py-24 md:py-36" : "py-20 md:py-28";
  return (
    <section className="relative overflow-hidden text-primary-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden
      />
      {/* Brand color overlay for legibility & on-theme look */}
      <div className="absolute inset-0 bg-hero-gradient opacity-85" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" aria-hidden />
      <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_20%_30%,white_1px,transparent_1px)] [background-size:36px_36px]" aria-hidden />

      <div className={`container relative ${padding}`}>
        <div className={`max-w-2xl animate-fade-in-up ${align === "center" ? "mx-auto text-center" : ""}`}>
          {eyebrow && (
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white/15 backdrop-blur mb-4">
              {eyebrow}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">{title}</h1>
          {subtitle && <p className={`text-base md:text-lg opacity-95 max-w-xl ${align === "center" ? "mx-auto" : ""}`}>{subtitle}</p>}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </section>
  );
};
