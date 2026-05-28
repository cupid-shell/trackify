import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://gwxixuuqhdjdeblhibly.supabase.co', 'sb_publishable_zYWIeMIhONqeo19ZVRWCYg_qHVNQh3E');

async function testColumn(col) {
  const dummyUserId = '00000000-0000-0000-0000-000000000000';
  const body = { user_id: dummyUserId };
  body[col] = [];
  const { error } = await supabase.from('user_settings').upsert(body).select();
  if (error && error.code === 'PGRST204') {
    return false;
  }
  return true;
}

async function main() {
  const candidates = [
    'presets', 'recurring_bills', 'quick_presets', 'recurring', 'bills', 
    'savings_goals', 'category_metadata', 'settings', 'preferences', 'metadata',
    'notification_preferences', 'notifications_settings', 'notification_settings'
  ];
  for (const c of candidates) {
    const exists = await testColumn(c);
    console.log(`Column ${c}: ${exists ? 'EXISTS (or RLS blocked)' : 'DOES NOT EXIST'}`);
  }
}
main();
