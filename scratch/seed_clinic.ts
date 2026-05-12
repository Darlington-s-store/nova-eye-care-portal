import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  const value = rest.join('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env');
  console.log('Available keys:', Object.keys(env));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

const clinicData = {
  name: "NOVA Eye Care Services",
  email: "info@novaeyecareservice.com",
  phone1: "0544172089",
  phone2: "0246613184",
  address: "Abuakwa - NsoNyamey3, Opposite Kasapreko Company Limited, Ashanti Region, Ghana",
  mapQuery: "Kasapreko PLC Abuakwa Factory",
  tagline: "See Better | Live Brighter"
};

const hoursData = {
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
};

async function seed() {
  console.log('Seeding clinic and hours data to Supabase...');
  
  // Seed Clinic Info
  const { error: clinicError } = await supabase
    .from('cms_content')
    .upsert({ 
      section_key: 'clinic', 
      content_json: clinicData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'section_key' });

  if (clinicError) console.error('Error seeding clinic data:', clinicError.message);
  else console.log('✓ Clinic data updated');

  // Seed Working Hours
  const { error: hoursError } = await supabase
    .from('cms_content')
    .upsert({ 
      section_key: 'hours', 
      content_json: hoursData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'section_key' });

  if (hoursError) console.error('Error seeding hours data:', hoursError.message);
  else console.log('✓ Hours data updated');

  if (clinicError || hoursError) process.exit(1);
  else {
    console.log('\nSuccessfully updated all data in database!');
    process.exit(0);
  }
}

seed();
