
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP POLICY "Anyone can create appointments" ON public.appointments;
CREATE POLICY "Guests or owner can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
