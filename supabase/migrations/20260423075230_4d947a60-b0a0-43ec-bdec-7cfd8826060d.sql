
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ AUTO-GRANT ADMIN TO SEEDED EMAILS ============
CREATE TABLE public.pending_admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pending_admin_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view pending" ON public.pending_admin_emails FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.pending_admin_emails (email) VALUES ('admin@novaeyecare.com');

-- Update handle_new_user to assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  -- Auto-assign admin if email is in pending list
  IF EXISTS (SELECT 1 FROM public.pending_admin_emails WHERE email = NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    DELETE FROM public.pending_admin_emails WHERE email = NEW.email;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

-- Re-create the trigger if missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ APPOINTMENTS: admins see all ============
CREATE POLICY "Admins view all appointments" ON public.appointments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all appointments" ON public.appointments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete all appointments" ON public.appointments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES: admins see all ============
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "Users view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all reviews" ON public.reviews FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update reviews" ON public.reviews FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reviews" ON public.reviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ NOTIFICATIONS ============
CREATE TYPE public.notification_audience AS ENUM ('user', 'admin');

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  audience public.notification_audience NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX notifications_recipient_idx ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX notifications_audience_idx ON public.notifications(audience, created_at DESC);

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT
  USING (audience = 'user' AND recipient_id = auth.uid());
CREATE POLICY "Admins view admin notifications" ON public.notifications FOR SELECT
  USING (audience = 'admin' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users insert notifications" ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE
  USING (audience = 'user' AND recipient_id = auth.uid());
CREATE POLICY "Admins update admin notifications" ON public.notifications FOR UPDATE
  USING (audience = 'admin' AND public.has_role(auth.uid(), 'admin'));

-- ============ CHATBOT KNOWLEDGE BASE ============
CREATE TABLE public.chatbot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active knowledge" ON public.chatbot_knowledge FOR SELECT USING (active = true);
CREATE POLICY "Admins manage knowledge" ON public.chatbot_knowledge FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER kb_updated_at BEFORE UPDATE ON public.chatbot_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed initial knowledge
INSERT INTO public.chatbot_knowledge (question, answer, category) VALUES
('What are your working hours?', 'We are open Monday to Friday from 8:00 am to 5:00 pm, and Saturday from 9:00 am to 2:00 pm. We are closed on Sundays.', 'hours'),
('How do I book an appointment?', 'You can book directly on our website by visiting the Book page, or call us at 0544172089. I can also help you start a booking right here.', 'booking'),
('What services do you offer?', 'We offer general eye health and vision care, contact lens services, binocular vision services, low vision and rehabilitation, corporate eye health, public eye health surveillance, and DVLA eye testing.', 'services'),
('How much does an eye test cost?', 'Pricing depends on the type of consultation. Please call 0544172089 for current rates and any insurance options.', 'pricing'),
('Where are you located?', 'You can find our address and a map on the Contact page of our website. Feel free to call us on 0544172089 for directions.', 'location');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
