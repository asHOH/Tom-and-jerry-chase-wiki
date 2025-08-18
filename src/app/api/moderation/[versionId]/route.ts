import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest, { params }: { params: { versionId: string } }) {
  const { versionId } = params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!versionId) {
    return NextResponse.json({ error: 'Missing version ID' }, { status: 400 });
  }

  if (!action || !['approve', 'reject', 'revoke'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be one of: approve, reject, revoke' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check user role
    const { data: userRole, error: roleError } = await supabaseAdmin.rpc('get_user_role', {
      user_id: user.id,
    });

    if (roleError) {
      console.error('Error checking user role:', roleError);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    if (!userRole || !['Reviewer', 'Coordinator'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Reviewer or Coordinator role required.' },
        { status: 403 }
      );
    }

    let functionName: `${'approve' | 'reject' | 'revoke'}_article_version`;
    switch (action) {
      case 'approve':
        functionName = 'approve_article_version';
        break;
      case 'reject':
        functionName = 'reject_article_version';
        break;
      case 'revoke':
        functionName = 'revoke_article_version';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error: actionError } = await supabaseAdmin.rpc(functionName, {
      version_id: versionId,
      reviewer_id: user.id,
    });
    if (actionError) {
      console.error(`Error executing ${action} action:`, actionError);

      // Handle specific error cases
      if (actionError.message.includes('Insufficient permissions')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to perform this action' },
          { status: 403 }
        );
      }

      if (actionError.message.includes('not found') || actionError.message.includes('not in')) {
        return NextResponse.json(
          { error: `Article version not found or not in the correct status for ${action}` },
          { status: 404 }
        );
      }

      return NextResponse.json({ error: `Failed to ${action} article version` }, { status: 500 });
    }

    return NextResponse.json({
      message: `Article version successfully ${action}${action === 'approve' ? 'd' : action === 'reject' ? 'ed' : 'd'}`,
      action,
      version_id: versionId,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
