import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env manually (Node doesn't do this automatically)
const envFile = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

/**
 * Whole-word spelling fixes applied to every meal name.
 * Rule-based rather than a fixed list of strings, so entries added after this
 * script was written get corrected too.
 */
const WORD_FIXES = [
  // Dish names
  [/\bbasai\s+kapuri\b/gi, 'Basar Ka Puri'],
  [/\bkhokdi\b/gi, 'Koki'],
  [/\bpalatha\b/gi, 'Paratha'],
  // Yogurt, however it got spelled
  [/\bdhai\b/gi, 'Dahi'],
  [/\bdhoi\b/gi, 'Dahi'],
];

function fixName(name) {
  return WORD_FIXES.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), name);
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const positional = args.filter(a => !a.startsWith('--'));
const email = positional[0] ?? process.env.MEAL_TRACKER_EMAIL;
const password = positional[1] ?? process.env.MEAL_TRACKER_PASSWORD;

if (!email || !password) {
  console.error('Usage: node scripts/fix-meal-names.mjs <email> <password> [--apply]');
  console.error('   or: MEAL_TRACKER_EMAIL=... MEAL_TRACKER_PASSWORD=... node scripts/fix-meal-names.mjs [--apply]');
  console.error('\nWithout --apply this is a dry run and changes nothing.');
  process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) {
  console.error('Auth failed:', authError.message);
  process.exit(1);
}

const { data: meals, error: readError } = await supabase
  .from('meal_entries')
  .select('id, date, type, name')
  .order('date', { ascending: true });

if (readError) {
  console.error('Read failed:', readError.message);
  process.exit(1);
}

const changes = meals
  .map(m => ({ ...m, newName: fixName(m.name) }))
  .filter(m => m.newName !== m.name);

if (changes.length === 0) {
  console.log(`Scanned ${meals.length} entries. Nothing to fix.`);
  process.exit(0);
}

// Summarise as old -> new so it's easy to eyeball before applying.
const byRename = new Map();
for (const c of changes) {
  const key = `${c.name}  ->  ${c.newName}`;
  byRename.set(key, (byRename.get(key) ?? 0) + 1);
}

console.log(`Scanned ${meals.length} entries. ${changes.length} row(s) to update:\n`);
for (const [rename, count] of [...byRename].sort()) {
  console.log(`  ${rename}   (${count} row${count !== 1 ? 's' : ''})`);
}

if (!apply) {
  console.log('\nDry run — nothing was changed. Re-run with --apply to write these.');
  process.exit(0);
}

console.log('\nApplying…');
let updated = 0;
for (const c of changes) {
  const { error } = await supabase
    .from('meal_entries')
    .update({ name: c.newName })
    .eq('id', c.id);

  if (error) {
    console.error(`  failed on ${c.date} ${c.type} ("${c.name}"): ${error.message}`);
    continue;
  }
  updated++;
}

console.log(`Updated ${updated} of ${changes.length} row(s).`);
