import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch current stored password hash if exists in settings
    const { data: storedSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .maybeSingle();

    let isMatch = false;
    if (storedSetting?.value) {
      isMatch = await bcrypt.compare(currentPassword, storedSetting.value);
    } else {
      // Fallback to environment variable
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      isMatch = currentPassword === defaultPassword;
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // 3. Save into settings table
    const { error: upsertErr } = await supabase.from('settings').upsert({
      key: 'admin_password_hash',
      value: newHash,
      updated_at: new Date().toISOString(),
      updated_by: session.username,
    });

    if (upsertErr) throw upsertErr;

    // 4. Record audit log
    await supabase.from('audit_logs').insert({
      action: 'CHANGE_PASSWORD',
      entity_type: 'admin',
      entity_id: session.username,
      actor: session.username,
      details: { changed_at: new Date().toISOString() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
