import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createHash } from 'crypto';

// Helper function to hash the username
// In a real-world scenario, ensure this matches the hashing strategy used during user creation.
const hashUsername = (username: string) => {
  return createHash('sha256').update(username).digest('hex');
};

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const usernameHash = hashUsername(username);

    // Query the users table to find a user with the matching username_hash
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('username_hash', usernameHash)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: "The result contains 0 rows"
      // We handle the "not found" case below, so we only throw for other errors.
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ status: 'not_exists' });
    }

    if (user.password_hash) {
      return NextResponse.json({ status: 'exists_with_password' });
    } else {
      return NextResponse.json({ status: 'exists_no_password' });
    }
  } catch (e) {
    console.error('Check-username error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
