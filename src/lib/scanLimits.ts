import { supabase } from "@/integrations/supabase/client";

/** Count how many scans the current user has done today (UTC). */
export async function getTodayScanCount(): Promise<number> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('scan_logs' as any)
    .select('id', { count: 'exact', head: true })
    .gte('scanned_at', today.toISOString());

  if (error) {
    console.warn('Failed to check scan count:', error);
    return 0; // fail open
  }
  return count ?? 0;
}

/** Log a scan for the current user. */
export async function logScan(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('scan_logs' as any)
    .insert({ user_id: user.id } as any);
}

/** Clear today's scan logs for the current user (used on tier upgrade). */
export async function clearTodayScans(): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await supabase
    .from('scan_logs' as any)
    .delete()
    .gte('scanned_at', today.toISOString());
}
