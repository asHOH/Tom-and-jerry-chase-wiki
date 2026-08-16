const QUERY_PAGE_SIZE = 500;

function quotePostgrestValue(value) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function keysetFilter(cursor) {
  const createdAt = quotePostgrestValue(cursor.created_at);
  const id = quotePostgrestValue(cursor.id);
  return `created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`;
}

export async function fetchGameDataActionRows(
  supabase,
  { select, statuses, requirePublic = null, fromUtc, toUtc, ids, entityTypes, scope = 'actions' }
) {
  const rows = [];
  let cursor;

  while (true) {
    let query = supabase.from('game_data_actions').select(select);
    if (statuses?.length === 1) query = query.eq('status', statuses[0]);
    else if (statuses?.length > 1) query = query.in('status', statuses);
    if (requirePublic !== null) query = query.eq('is_public', requirePublic);
    if (fromUtc !== undefined) query = query.gte('created_at', fromUtc);
    if (toUtc !== undefined) query = query.lt('created_at', toUtc);
    if (ids?.length > 0) query = query.in('id', ids);
    if (entityTypes?.length > 0) query = query.in('entity_type', entityTypes);
    if (cursor !== undefined) query = query.or(keysetFilter(cursor));

    const { data, error } = await query
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(QUERY_PAGE_SIZE);

    if (error) {
      const queryError = new Error('game_data_action_query_failed');
      queryError.code = 'query_failed';
      queryError.scope = scope;
      throw queryError;
    }
    const page = data ?? [];
    rows.push(...page);
    if (page.length < QUERY_PAGE_SIZE) break;

    const last = page.at(-1);
    if (!last?.created_at || !last.id) {
      const pageError = new Error('invalid_game_data_action_query_page');
      pageError.code = 'invalid_query_page';
      pageError.scope = scope;
      throw pageError;
    }
    cursor = { created_at: last.created_at, id: last.id };
  }

  return rows;
}
