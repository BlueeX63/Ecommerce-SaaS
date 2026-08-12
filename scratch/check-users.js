const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('*').limit(5);
  if (error) {
    console.error('Error fetching users:', error.message);
  } else {
    console.log('Users found:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkUsers();
