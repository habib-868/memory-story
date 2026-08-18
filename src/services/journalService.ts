import { supabase } from '../lib/supabase';

export async function loadActiveJournal(userId: string) {
  const { data: journal, error: journalError } = await supabase
    .from('journals')
    .select('id, start_date, end_date, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (journalError) {
    throw new Error(journalError.message);
  }

  return journal;
}