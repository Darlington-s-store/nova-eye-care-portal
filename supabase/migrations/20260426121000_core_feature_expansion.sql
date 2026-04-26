-- 1. Create Enums for structural integrity
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('patient', 'super_admin', 'optometrist', 'receptionist');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status_v2') THEN
        CREATE TYPE appointment_status_v2 AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('appointment_reminder', 'follow_up', 'broadcast', 'individual');
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Upgrade Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'patient',
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Patient Medical History
CREATE TABLE IF NOT EXISTS public.patient_medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ocular_history TEXT,
    systemic_conditions TEXT,
    current_medications TEXT,
    family_eye_history TEXT,
    allergies TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Eye Screenings (The clinical backbone)
CREATE TABLE IF NOT EXISTS public.eye_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    screened_by UUID REFERENCES public.profiles(id),
    screening_date DATE DEFAULT CURRENT_DATE,
    va_right_eye TEXT,
    va_left_eye TEXT,
    iop_right DECIMAL,
    iop_left DECIMAL,
    colour_vision_result TEXT,
    contrast_sensitivity TEXT,
    external_exam_notes TEXT,
    diagnosis TEXT,
    recommended_followup TEXT,
    is_visible_to_patient BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Universal Notification System
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type notification_type DEFAULT 'individual',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Dynamic CMS Content Repository
CREATE TABLE IF NOT EXISTS public.cms_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT UNIQUE NOT NULL,
    content_json JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Security: Enable RLS for all new tables
ALTER TABLE public.patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eye_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

-- 8. Policies: Clinical visibility and Admin control
-- Admin can manage everything
CREATE POLICY "Admins have full access to patient health data" ON public.patient_medical_history
    USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'optometrist'));

-- Patients can view their own history
CREATE POLICY "Patients view own history" ON public.patient_medical_history
    FOR SELECT USING (auth.uid() = patient_id);

-- Eye Screenings visibility
CREATE POLICY "Optometrists manage screenings" ON public.eye_screenings
    USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'optometrist'));

CREATE POLICY "Patients view visible screenings" ON public.eye_screenings
    FOR SELECT USING (auth.uid() = patient_id AND is_visible_to_patient = true);

-- CMS Content (Read by public, written by admin)
CREATE POLICY "Anyone can view CMS content" ON public.cms_content
    FOR SELECT USING (true);

CREATE POLICY "Super Admins manage CMS" ON public.cms_content
    USING (public.has_role(auth.uid(), 'super_admin'));
