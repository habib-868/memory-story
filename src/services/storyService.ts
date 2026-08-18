import { supabase } from '../lib/supabase';

export async function generateStory(memories: string[]) {
  const { data, error } = await supabase.functions.invoke(
    'rapid-action',
    {
      body: {
        memories,
      },
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  const story = data?.story;

  if (!story) {
    throw new Error('No story was returned.');
  }

  return story;
}

export async function completeJournalAndCreateNext(
  journalId: string,
  story: string,
) {
  const { data: newJournalId, error } =
    await supabase.rpc(
      'complete_journal_and_create_next',
      {
        p_journal_id: journalId,
        p_story: story,
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  if (!newJournalId) {
    throw new Error('No new journal was created.');
  }

  return newJournalId;
}