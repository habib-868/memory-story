import { supabase } from '../lib/supabase';

type SavePhotoParams = {
  userId: string;
  journalId: string;
  selectedDayId: string;
  storagePath: string;
  fileBytes: Uint8Array;
  existingPhotoId?: string | null;
  existingStoragePath?: string | null;
};

export async function saveJournalPhoto({
  userId,
  journalId,
  selectedDayId,
  storagePath,
  fileBytes,
  existingPhotoId,
  existingStoragePath,
}: SavePhotoParams) {
  // userId and journalId are part of the storage path/operation context.
  // Keep them here for the service API even though Supabase policies
  // perform the actual authorization.
  void userId;
  void journalId;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(storagePath, fileBytes, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  if (existingPhotoId) {
    const { error: photoError } = await supabase
      .from('photos')
      .update({
        storage_path: storagePath,
      })
      .eq('id', existingPhotoId);

    if (photoError) {
      await supabase.storage
        .from('photos')
        .remove([storagePath]);

      throw new Error(
        `Could not replace photo: ${photoError.message}`,
      );
    }

    if (existingStoragePath) {
      await supabase.storage
        .from('photos')
        .remove([existingStoragePath]);
    }
  } else {
    const { error: photoError } = await supabase
      .from('photos')
      .insert({
        journal_day_id: selectedDayId,
        storage_path: storagePath,
      });

    if (photoError) {
      await supabase.storage
        .from('photos')
        .remove([storagePath]);

      throw new Error(
        `Could not save photo: ${photoError.message}`,
      );
    }
  }
}


export async function deleteJournalPhoto(
  photoId: string,
  storagePath: string,
) {
  const { error: photoError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId);

  if (photoError) {
    throw new Error(photoError.message);
  }

  const { error: storageError } = await supabase.storage
    .from('photos')
    .remove([storagePath]);

  if (storageError) {
    throw new Error(
      `The photo record was removed, but the stored image could not be removed: ${storageError.message}`,
    );
  }
}