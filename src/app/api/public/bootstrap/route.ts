import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Check if link is locked in settings
    const { data: settingData, error: settingError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'link_locked')
      .single();

    if (settingError && settingError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingError);
    }

    const isLocked = settingData?.value === 'true';

    if (isLocked) {
      return NextResponse.json(
        {
          isLocked: true,
          workers: [],
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          },
        }
      );
    }

    // 2. Fetch active workers (case-insensitive for safety)
    const { data: workers, error: workerError } = await supabase
      .from('workers')
      .select('id, worker_name, department, status')
      .ilike('status', 'active')
      .order('worker_name', { ascending: true });

    if (workerError) {
      console.error('Error fetching workers:', workerError);
      return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
    }

    return NextResponse.json(
      {
        isLocked: false,
        workers: workers || [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
