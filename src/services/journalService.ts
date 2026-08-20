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
      journal_id,
      content,
      created_at,
      journals!inner (
        status,
        start_date,
        end_date
      )
    `)
    .eq('journals.status', 'completed')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  

  return (stories ?? []).map((item) => {
  const journal = Array.isArray(item.journals)
    ? item.journals[0]
    : item.journals;

  return {
    id: item.id,
    journal_id: item.journal_id,
    content: item.content,
    created_at: item.created_at,
    start_date: journal?.start_date ?? null,
    end_date: journal?.end_date ?? null,
  };
});

}
export async function loadStoryById(storyId: string) {
  const { data: story, error } = await supabase
    .from('stories')
    .select(`
      id,
      journal_id,
      content,
      created_at,
      journals!inner (
        status,
        start_date,
        end_date
      )
    `)
    .eq('id', storyId)
    .eq('journals.status', 'completed')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!story) {
    return null;
  }

  const journal = Array.isArray(story.journals)
    ? story.journals[0]
    : story.journals;

  return {
    id: story.id,
    journal_id: story.journal_id,
    content: story.content,
    created_at: story.created_at,
    start_date: journal?.start_date ?? null,
    end_date: journal?.end_date ?? null,
  };
}

export type JournalDayData = {
  id: string;
  day_number: number;
  memoryText: string;
  photoId: string | null;
  storagePath: string | null;
  photoUrl: string | null;
};

export type ActiveJournalData = {
  journalId: string;
  days: JournalDayData[];
  story: string;
};

export async function loadActiveJournalData(
  userId: string,
): Promise<ActiveJournalData | null> {
  const journal = await loadActiveJournal(userId);

  if (!journal) {
    return null;
  }

  const { data: journalDays, error: daysError } = await supabase
    .from('journal_days')
    .select(`
      id,
      day_number,
      memory_text,
      photos (
        id,
        storage_path
      )
    `)
    .eq('journal_id', journal.id)
    .order('day_number', { ascending: true });

  if (daysError) {
    throw new Error(daysError.message);
  }

  const days: JournalDayData[] = [];

  for (const day of journalDays ?? []) {
    const photo = day.photos?.[0];

    let photoUrl: string | null = null;

    if (photo) {
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from('photos')
          .createSignedUrl(photo.storage_path, 60 * 60);

      if (!signedUrlError && signedUrlData) {
        photoUrl = signedUrlData.signedUrl;
      }
    }

    days.push({
      id: day.id,
      day_number: day.day_number,
      memoryText: day.memory_text ?? '',
      photoId: photo?.id ?? null,
      storagePath: photo?.storage_path ?? null,
      photoUrl,
    });
  }

  const { data: savedStory, error: storyError } = await supabase
    .from('stories')
    .select('content')
    .eq('journal_id', journal.id)
    .maybeSingle();

  if (storyError) {
    throw new Error(storyError.message);
  }

  return {
    journalId: journal.id,
    days,
    story: savedStory?.content ?? '',
  };
}

export async function createJournal(userId: string) {
  const { data: existingJournal, error: existingJournalError } =
    await supabase
      .from('journals')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

  if (existingJournalError) {
    throw new Error(existingJournalError.message);
  }

  if (existingJournal) {
    return {
      journalId: existingJournal.id,
      alreadyExists: true,
    };
  }

  const startDate = new Date();
  const endDate = new Date(startDate);

  endDate.setDate(endDate.getDate() + 6);

  const { data: journal, error: journalError } =
    await supabase
      .from('journals')
      .insert({
        user_id: userId,
        title: 'My 7-Day Story',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
      })
      .select('id')
      .single();

  if (journalError || !journal) {
    throw new Error(
      journalError?.message ?? 'Something went wrong.',
    );
  }

  const newDays = Array.from({ length: 7 }, (_, index) => ({
    journal_id: journal.id,
    day_number: index + 1,
  }));

  const { error: daysError } = await supabase
    .from('journal_days')
    .insert(newDays);

  if (daysError) {
    throw new Error(daysError.message);
  }

  return {
    journalId: journal.id,
    alreadyExists: false,
  };
}

export async function saveJournalMemory(
  journalDayId: string,
  memoryText: string,
) {
  const { error } = await supabase
    .from('journal_days')
    .update({
      memory_text: memoryText,
    })
    .eq('id', journalDayId);

  if (error) {
    throw new Error(error.message);
  }
}