import { supabase } from "@/integrations/supabase/client";
import { CLINIC } from "./clinic";

export type HeroContent = {
  heading: string;
  subheading: string;
  cta1: string;
  cta2: string;
};

export type TeamMember = {
  name: string;
  title: string;
  bio: string;
  photo: string;
};

export type Announcements = {
  enabled: boolean;
  message: string;
};

export type ClinicContact = {
  name: string;
  email: string;
  phone1: string;
  phone2: string;
  address: string;
  mapQuery: string;
  tagline: string;
};

export type CMSContent = {
  hero?: HeroContent;
  team?: { members: TeamMember[] };
  hours?: Record<string, string>;
  announcements?: Announcements;
  clinic?: ClinicContact;
};

const CACHE_KEY = "nova_cms_cache";
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

export const getCMSContent = async <T = unknown>(section: string): Promise<T | null> => {
  // Check cache first
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${section}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TIME) {
        return data;
      }
    }
  } catch (e) {
    console.warn("CMS Cache read error", e);
  }

  // Fetch from Supabase
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("cms_content")
      .select("content_json")
      .eq("section_key", section)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      const content = data.content_json;
      // Save to cache
      localStorage.setItem(`${CACHE_KEY}_${section}`, JSON.stringify({
        data: content,
        timestamp: Date.now()
      }));
      return content;
    }
  } catch (e) {
    console.error(`Failed to fetch CMS section: ${section}`, e);
  }

  return null;
};

export const getClinicContact = async (): Promise<ClinicContact> => {
  const data = await getCMSContent<ClinicContact>("clinic");
  if (data) return data;
  
  return {
    name: CLINIC.name,
    email: CLINIC.email,
    phone1: CLINIC.phones[0],
    phone2: CLINIC.phones[1] || "",
    address: CLINIC.address,
    mapQuery: "Kasapreko PLC Abuakwa Factory",
    tagline: CLINIC.tagline
  };
};
