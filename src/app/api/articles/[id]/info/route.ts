import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

  if (!id) {
    return res.status(400).json({ error: 'Missing article ID' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select(
        'id, title, category_id, created_at, article_versions(content, editor_id, status, created_at)'
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch article information' });
    }

    res.status(200).json({ article: data });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
