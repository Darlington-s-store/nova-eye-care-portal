INSERT INTO public.cms_content (section_key, content_json, updated_at)
VALUES 
(
  'clinic',
  '{
    "name": "NOVA Eye Care Services",
    "email": "info@novaeyecareservice.com",
    "phone1": "0544172089",
    "phone2": "0246613184",
    "address": "Abuakwa - NsoNyamey3, Opposite Kasapreko Company Limited, Ashanti Region, Ghana",
    "mapQuery": "Kasapreko PLC Abuakwa Factory",
    "tagline": "See Better | Live Brighter"
  }'::jsonb,
  now()
),
(
  'hours',
  '{
    "Monday": "8:00 AM",
    "Monday_to": "5:00 PM",
    "Tuesday": "8:00 AM",
    "Tuesday_to": "5:00 PM",
    "Wednesday": "8:00 AM",
    "Wednesday_to": "5:00 PM",
    "Thursday": "8:00 AM",
    "Thursday_to": "5:00 PM",
    "Friday": "8:00 AM",
    "Friday_to": "5:00 PM",
    "Saturday": "9:00 AM",
    "Saturday_to": "2:00 PM",
    "Sunday": "Closed"
  }'::jsonb,
  now()
)
ON CONFLICT (section_key) DO UPDATE 
SET content_json = EXCLUDED.content_json, 
    updated_at = EXCLUDED.updated_at;
