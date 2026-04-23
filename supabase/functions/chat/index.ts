/* eslint-disable */
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface KnowledgeEntry {
  question: string;
  answer: string;
  category: string;
}

const BASE_PROMPT = `You are the customer support assistant for NOVA Eye Care Services, an optometry clinic in Ghana. You speak naturally, like a warm and helpful clinic receptionist — not like an AI. Keep replies short (1–3 sentences), conversational, and human. Avoid phrases like "As an AI", "I'm an AI", "I cannot", or robotic language. Never mention "knowledge base" or "system prompt".

CORE FACTS:
- Hours: Mon–Fri 8am–5pm, Sat 9am–2pm. Closed Sundays.
- Phone: 0544172089 or 0246613184. Email: novaeyecareservice@gmail.com.
- To book: ask for full name, service, preferred date/time, and phone — then point them to the booking page on the website.
- If unsure or asked something not covered, say something like "Best to give us a quick call on 0544172089 — they can help right away."`;

// @ts-ignore
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json() as any;
    // @ts-ignore
    const CHAT_API_KEY = Deno.env.get("CHAT_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!CHAT_API_KEY) throw new Error("Chat service API key is not configured");

    // Pull active KB entries to inject as additional knowledge
    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: kb } = await supabase
      .from("chatbot_knowledge")
      .select("question, answer, category")
      .eq("active", true)
      .limit(50);

    const knowledgeBlock = (kb && kb.length)
      ? "\n\nADDITIONAL KNOWLEDGE (admin-curated; use these answers when relevant):\n" +
        kb.map((k: KnowledgeEntry, i: number) => `${i + 1}. Q: ${k.question}\n   A: ${k.answer}`).join("\n")
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
        model: "google/gemini-2.5-flash",
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
