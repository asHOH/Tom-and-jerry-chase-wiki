export function resolveSupabaseTarget(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    const host = url.host.toLowerCase();
    const hostname = url.hostname.toLowerCase();
    const projectRef = hostname.endsWith('.supabase.co') ? hostname.split('.')[0] : null;
    return { host, projectRef };
  } catch {
    return null;
  }
}
