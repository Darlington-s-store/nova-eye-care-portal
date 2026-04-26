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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    
    // @ts-ignore
    const CHAT_API_KEY = Deno.env.get("CHAT_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!CHAT_API_KEY) {
      console.error("Missing API Key");
      return new Response(JSON.stringify({ error: "AI Chat key not found in Supabase Secrets." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Pull active KB entries
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    
    let kbContent = "";
    try {
      const { data: kb, error: kbError } = await supabase
        .from("chatbot_knowledge")
        .select("question, answer")
        .eq("active", true)
        .limit(20);
        
      if (kbError) console.error("KB Fetch Error:", kbError);
      
      if (kb && kb.length > 0) {
        kbContent = "\n\nUSE THESE ANSWERS:\n" + 
          kb.map((k: any) => `Q: ${k.question}\nA: ${k.answer}`).join("\n");
      }
    } catch (err) {
      console.error("Supabase KB Query Exception:", err);
    }

    const systemPrompt = BASE_PROMPT + kbContent;
    // @ts-ignore
    const gatewayUrl = Deno.env.get("AI_GATEWAY_URL") || "https://ai.gateway.lovable.dev/v1/chat/completions";

    console.log("Fetching AI Gateway:", gatewayUrl);

    const aiResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CHAT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway Error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: `AI Gateway error (${aiResponse.status})` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e: any) {
    console.error("Global Chat Error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
