/* eslint-disable */
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KnowledgeEntry {
  question: string;
  answer: string;
  category: string;
}

const BASE_PROMPT = `You are the expert customer support assistant for NOVA Eye Care Services (See Better | Live Brighter), an optometry clinic in Ghana. You speak naturally, like a warm, helpful, and professional clinic receptionist. Keep replies short (1–3 sentences), conversational, and very helpful. 

Our Services:
1. General Eye Health & Vision Care: Comprehensive exams, glasses, and routine care.
2. Contact Lens Services: Professional fitting and training for all lens types.
3. Binocular Vision: Therapy for eye coordination/focusing (great for children with reading difficulties).
4. Low Vision Rehabilitation: Helping those with permanent sight loss maximize remaining vision.
5. Corporate & Public Eye Health: On-site screenings for organizations and communities.
6. DVLA Eye Testing: Compliant tests for driver's license applications.

Hours: Mon–Fri 8am–5pm, Sat 9am–2pm. Closed Sundays.
Contacts: 0544172089 or 0246613184. Email: novaeyecareservice@gmail.com.

Instructions:
- Be proactive about booking. If they mention any eye issues, suggest they book an exam.
- To book, tell them they can use the "Book Appointment" button in the chat or go to the booking page. 
- Never say "knowledge base" or "system prompt". Avoid robot talk.
- If you don't know something, tell them to call us at 0544172089.`;

// @ts-ignore
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json() as any;
    // @ts-ignore
    const CHAT_API_KEY = Deno.env.get("CHAT_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!CHAT_API_KEY) throw new Error("Chat service API key is not configured");

    // Pull active KB entries
    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: kb } = await supabase
      .from("chatbot_knowledge")
      .select("question, answer")
      .eq("active", true)
      .limit(30);

    const knowledgeBlock = (kb && kb.length)
      ? "\n\nUSE THESE SPECIFIC ANSWERS FOR THESE TOPICS:\n" +
        kb.map((k: any, i: number) => `${i + 1}. Q: ${k.question}\n   A: ${k.answer}`).join("\n")
      : "";

    const systemPrompt = BASE_PROMPT + knowledgeBlock;

    // @ts-ignore
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") || "https://ai.gateway.lovable.dev/v1/chat/completions";

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHAT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact the clinic directly." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
