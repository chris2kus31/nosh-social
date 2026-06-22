import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export type AvatarUploadResult =
  | { status: 'uploaded'; url: string }
  | { status: 'cancelled' }
  | { status: 'denied' };

/**
 * Launch the photo library, then upload the chosen image to the `avatars`
 * bucket under the user's folder. Returns the public URL on success.
 * Mirrors the web app's avatar upload (max ~5MB, square crop).
 */
export async function pickAndUploadAvatar(userId: string): Promise<AvatarUploadResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled) return { status: 'cancelled' };

  const asset = result.assets[0];
  if (!asset.base64) throw new Error('Could not read the selected image.');

  const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
  const contentType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, decode(asset.base64), { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { status: 'uploaded', url: data.publicUrl };
}
