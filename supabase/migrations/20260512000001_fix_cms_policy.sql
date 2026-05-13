-- Fix the RLS policy for cms_content to use the correct role and enum type
DROP POLICY IF EXISTS "Super Admins manage CMS" ON public.cms_content;

CREATE POLICY "Admins manage CMS" ON public.cms_content
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
