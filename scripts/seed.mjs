import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env manually (Node doesn't do this automatically)
const envFile = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Sign in to get a valid session (RLS requires auth)
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/seed.mjs <email> <password>');
  process.exit(1);
}

const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) {
  console.error('Auth failed:', authError.message);
  process.exit(1);
}

const userId = authData.user.id;
console.log(`Signed in as ${userId}`);

const meals = [
  { date: '2026-02-06', type: 'lunch', name: 'Mattar Paneer' },
  { date: '2026-02-06', type: 'dinner', name: 'Egg Bhurji Rolls' },
  { date: '2026-02-07', type: 'lunch', name: 'Pasta, Salad' },
  { date: '2026-02-07', type: 'dinner', name: 'Vegan Cobb Salad' },
  { date: '2026-02-08', type: 'lunch', name: 'Rajma, Rice' },
  { date: '2026-02-08', type: 'dinner', name: 'Palak Tofu, Roti, Salad' },
  { date: '2026-02-09', type: 'lunch', name: 'Bombay Grilled Sandwiches' },
  { date: '2026-02-09', type: 'dinner', name: 'Lettuce Tofu Wraps' },
  { date: '2026-02-10', type: 'lunch', name: 'Idli Sambar, Chutney' },
  { date: '2026-02-10', type: 'dinner', name: 'Slow Cooker Chili' },
  { date: '2026-02-11', type: 'lunch', name: 'Roasted Veggie Wrap' },
  { date: '2026-02-11', type: 'dinner', name: 'Chili / Dosa' },
  { date: '2026-02-12', type: 'lunch', name: 'Pasta Salad' },
  { date: '2026-02-12', type: 'dinner', name: 'Pizza' },
  { date: '2026-02-13', type: 'lunch', name: 'Sprouted Moong' },
  { date: '2026-02-13', type: 'dinner', name: 'Malai Kofta, Roti, Salad' },
  { date: '2026-02-14', type: 'lunch', name: 'Falafel Sandwich' },
  { date: '2026-02-14', type: 'dinner', name: 'Hot Dogs, Grilled Veggies' },
  { date: '2026-02-15', type: 'lunch', name: 'Mattar Paneer, Rice, Roti' },
  { date: '2026-02-15', type: 'dinner', name: 'Veggie Bowl' },
  { date: '2026-02-16', type: 'lunch', name: 'Dal Makhani, Naan' },
  { date: '2026-02-16', type: 'dinner', name: 'Mexican Rice Casserole' },
  { date: '2026-02-17', type: 'lunch', name: 'Curry Chawal, Cabbage Poriyal' },
  { date: '2026-02-17', type: 'dinner', name: 'Lettuce Tofu Wraps' },
  { date: '2026-02-18', type: 'lunch', name: 'Biryani' },
  { date: '2026-02-18', type: 'dinner', name: 'Soup, Handvo, Nachos' },
  { date: '2026-02-19', type: 'lunch', name: 'Pizza' },
  { date: '2026-02-19', type: 'dinner', name: 'Pav Bhaji' },
  { date: '2026-02-20', type: 'lunch', name: 'Koki, Dahi' },
  { date: '2026-02-20', type: 'dinner', name: 'Kala Chana Rice' },
  { date: '2026-02-21', type: 'lunch', name: 'Capsicum Tofu Rolls' },
  { date: '2026-02-21', type: 'dinner', name: 'Pasta, Salad, Garlic Bread' },
  { date: '2026-02-22', type: 'lunch', name: 'Grilled Cheese' },
  { date: '2026-02-22', type: 'dinner', name: 'Pav Bhaji' },
  { date: '2026-02-23', type: 'lunch', name: 'Moong, Roti, Bhajia' },
  { date: '2026-02-23', type: 'dinner', name: 'Soya Chaap Kathi Roll' },
  { date: '2026-02-24', type: 'lunch', name: 'Falafel Sandwich' },
  { date: '2026-02-24', type: 'dinner', name: 'Palak Tofu, Roti, Salad' },
  { date: '2026-02-25', type: 'lunch', name: 'Hot Dogs, Grilled Veggies' },
  { date: '2026-02-25', type: 'dinner', name: 'Mattar Paneer, Rice, Roti' },
  { date: '2026-02-26', type: 'lunch', name: 'Veggie Bowl' },
  { date: '2026-02-26', type: 'dinner', name: 'Dal Makhani, Naan' },
  { date: '2026-02-27', type: 'lunch', name: 'Idli Sambar, Chutney' },
  { date: '2026-02-27', type: 'dinner', name: 'Thepla, Gunda Bateta, Brinjal Fry' },
  { date: '2026-02-28', type: 'lunch', name: 'Lasagna, Garlic Bread, Salad' },
  { date: '2026-02-28', type: 'dinner', name: 'Dudhi Chana Dal, Roti' },
  { date: '2026-03-01', type: 'lunch', name: 'Pizza, Salad' },
  { date: '2026-03-01', type: 'dinner', name: 'Kadhi, Khichdi' },
  { date: '2026-03-02', type: 'lunch', name: 'Tofu Fajitas' },
  { date: '2026-03-02', type: 'dinner', name: 'Chowli, Rice' },
  { date: '2026-03-03', type: 'lunch', name: 'Methi Matar Malai' },
  { date: '2026-03-03', type: 'dinner', name: 'Bombay Grilled Sandwich' },
  { date: '2026-03-04', type: 'lunch', name: 'Hot Dogs, Grilled Veggies, Corn' },
  { date: '2026-03-04', type: 'dinner', name: 'Idli Sambar, Chutney' },
  { date: '2026-03-05', type: 'lunch', name: 'Lasagna, Garlic Bread, Salad' },
  { date: '2026-03-05', type: 'dinner', name: 'Pizza, Salad' },
];

const rows = meals.map(m => ({ user_id: userId, ...m }));

const { data, error } = await supabase
  .from('meal_entries')
  .upsert(rows, { onConflict: 'user_id,date,type' })
  .select();

if (error) {
  console.error('Insert failed:', error.message);
  process.exit(1);
}

console.log(`Inserted ${data.length} meal entries.`);
