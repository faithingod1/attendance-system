import { NextResponse } from 'next/server';
import { setAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const expectedUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();

    if (!username || !password || username.trim().toLowerCase() !== expectedUsername) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if custom password hash is saved in settings
    let isPasswordCorrect = false;
    try {
      const supabase = getSupabaseAdmin();
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .maybeSingle();

      if (setting?.value) {
        isPasswordCorrect = await bcrypt.compare(password, setting.value);
      }
    } catch (dbErr) {
      console.warn('Database password check failed, falling back to env var:', dbErr);
    }

    // If not set in DB, check against process.env.ADMIN_PASSWORD
    if (!isPasswordCorrect) {
      const fallbackPassword = process.env.ADMIN_PASSWORD || 'admin123';
      if (password === fallbackPassword) {
        isPasswordCorrect = true;
      }
    }

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    await setAdminSession(username.trim());
    return NextResponse.json({ success: true, username: username.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
