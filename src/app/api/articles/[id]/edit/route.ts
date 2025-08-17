import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (req.method !== 'POST' || !user) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const { title, category, content } = req.body;

  if (!id || !title || !category || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('submit_article', {
      article_id: id,
      title,
      content,
      category_id: category,
      editor_id: user.id,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({ error: 'Failed to update article' });
    }

    res.status(200).json({ message: 'Article updated successfully', data });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
