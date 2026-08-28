export function resolveSupabaseTarget(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return { host: url.host.toLowerCase() };
  } catch {
    return null;
  }
}
