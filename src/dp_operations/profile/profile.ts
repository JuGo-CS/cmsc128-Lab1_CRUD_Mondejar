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
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return { data, error };
}
