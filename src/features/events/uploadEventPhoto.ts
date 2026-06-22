import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export type PhotoUploadResult =
  | { status: 'uploaded'; url: string }
  | { status: 'cancelled' }
  | { status: 'denied' };

/**
 * Pick an image and upload it to the `event-photos` bucket under the user's
 * folder. Returns the public URL. Used for event cover photos and (later) the
 * live photo gallery.
 */
export async function pickAndUploadEventPhoto(userId: string): Promise<PhotoUploadResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled) return { status: 'cancelled' };

  const asset = result.assets[0];
  if (!asset.base64) throw new Error('Could not read the selected image.');

  const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
  const contentType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const path = `${userId}/event-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('event-photos')
    .upload(path, decode(asset.base64), { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('event-photos').getPublicUrl(path);
  return { status: 'uploaded', url: data.publicUrl };
}
