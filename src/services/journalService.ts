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

export async function loadCompletedStories() {
  const { data: stories, error } = await supabase
    .from('stories')
    .select(`
      id,
      content,
      created_at,
      journals!inner (
        status
      )
    `)
    .eq('journals.status', 'completed')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (stories ?? []).map((item) => ({
    id: item.id,
    content: item.content,
    created_at: item.created_at,
  }));
}