import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://gwxixuuqhdjdeblhibly.supabase.co', 'sb_publishable_zYWIeMIhONqeo19ZVRWCYg_qHVNQh3E');

async function main() {
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: true });
  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }
  console.log('--- Transactions ---');
  data.forEach(t => {
    console.log(`${t.date}: ${t.type} - ${t.category} - ৳${t.amount} (${t.note})`);
  });
}
main();
