// Dev helper: prints the first few users. Run from backend/ with `node scripts/check-users.js`.
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run this from backend/ with a .env file present.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('user_id, email, status, email_verified, created_date').limit(5);
  if (error) {
    console.error('Error fetching users:', error.message);
  } else {
    console.log('Users found:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkUsers();
