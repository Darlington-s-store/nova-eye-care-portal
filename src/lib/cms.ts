import { supabase } from "@/integrations/supabase/client";

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

export type CMSContent = {
  hero?: HeroContent;
  team?: { members: TeamMember[] };
  hours?: Record<string, string>;
  announcements?: Announcements;
};

const CACHE_KEY = "nova_cms_cache";
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

export const getCMSContent = async <T = any>(section: string): Promise<T | null> => {
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
