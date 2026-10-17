import { NextResponse } from 'next/server';
import { setAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const expectedUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (
      !username ||
      !password ||
      username.trim().toLowerCase() !== expectedUsername ||
      password !== expectedPassword
    ) {
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
