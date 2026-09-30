import { supabase } from '../../lib/supabase';

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', userId)
    .single();

  return { data, error };
}

export async function updateProfile(userId: string, updates: { username?: string; display_name?: string }) {
  // 1. If updating display_name, update Supabase Auth User Metadata too
  if (updates.display_name) {
    await supabase.auth.updateUser({
      data: { full_name: updates.display_name.trim() },
    });
  }

  // 2. Update the custom profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return { data, error };
}

