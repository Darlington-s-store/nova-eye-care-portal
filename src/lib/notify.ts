import { supabase } from "@/integrations/supabase/client";

type NotificationInput = {
  title: string;
  body: string;
  link?: string;
};

export const notifyUser = async (recipientId: string, n: NotificationInput) => {
  await supabase.from("notifications").insert({
    recipient_id: recipientId,
    audience: "user",
    title: n.title,
    body: n.body,
    link: n.link ?? null,
  });
};

export const notifyAdmins = async (n: NotificationInput) => {
  // recipient_id null + audience admin -> visible to any admin via RLS
  await supabase.from("notifications").insert({
    recipient_id: null,
    audience: "admin",
    title: n.title,
    body: n.body,
    link: n.link ?? null,
  });
};
