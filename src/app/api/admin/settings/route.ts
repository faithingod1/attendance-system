import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const { isLocked } = await request.json();

    const supabase = getSupabaseAdmin();
    const lockVal = isLocked ? 'true' : 'false';

    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'link_locked',
        value: lockVal,
        updated_at: new Date().toISOString(),
        updated_by: session.username,
      });

    if (error) throw error;

    // Record audit log
    await supabase.from('audit_logs').insert({
      action: isLocked ? 'LOCK_LINK' : 'UNLOCK_LINK',
      entity_type: 'settings',
      entity_id: 'link_locked',
      actor: session.username,
      details: { isLocked },
    });

    return NextResponse.json({ success: true, isLocked });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
