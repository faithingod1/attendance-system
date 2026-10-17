import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdmin();

    const { data: settings, error } = await supabase.from('settings').select('*');
    if (error) throw error;

    const map: Record<string, string> = {};
    settings?.forEach((s) => {
      map[s.key] = s.value;
    });

    return NextResponse.json({
      isLocked: map['link_locked'] === 'true',
      submissionLinkUrl: map['submission_link_url'] || '',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const { isLocked, submissionLinkUrl } = body;

    const supabase = getSupabaseAdmin();

    if (isLocked !== undefined) {
      const lockVal = isLocked ? 'true' : 'false';
      await supabase.from('settings').upsert({
        key: 'link_locked',
        value: lockVal,
        updated_at: new Date().toISOString(),
        updated_by: session.username,
      });

      await supabase.from('audit_logs').insert({
        action: isLocked ? 'LOCK_LINK' : 'UNLOCK_LINK',
        entity_type: 'settings',
        entity_id: 'link_locked',
        actor: session.username,
        details: { isLocked },
      });
    }

    if (submissionLinkUrl !== undefined) {
      await supabase.from('settings').upsert({
        key: 'submission_link_url',
        value: submissionLinkUrl.trim(),
        updated_at: new Date().toISOString(),
        updated_by: session.username,
      });

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_SUBMISSION_URL',
        entity_type: 'settings',
        entity_id: 'submission_link_url',
        actor: session.username,
        details: { url: submissionLinkUrl.trim() },
      });
    }

    return NextResponse.json({
      success: true,
      isLocked,
      submissionLinkUrl,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
