import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { AttendanceDay } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const month = parseInt(searchParams.get('month') || '0', 10);
    const year = parseInt(searchParams.get('year') || '0', 10);

    if (!workerId || !month || !year) {
      return NextResponse.json({ error: 'Missing workerId, month, or year' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check lock
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'link_locked')
      .single();

    if (setting?.value === 'true') {
      return NextResponse.json(
        { error: 'Attendance submission is currently closed' },
        { status: 403 }
      );
    }

    // Keep the lock check first, then load independent records concurrently.
    const [submissionResult, daysResult] = await Promise.all([
      supabase.from('submissions').select('*')
        .eq('worker_id', workerId).eq('month', month).eq('year', year).maybeSingle(),
      supabase.from('attendance').select('*')
        .eq('worker_id', workerId).eq('month', month).eq('year', year)
        .order('attendance_date', { ascending: true }),
    ]);
    const { data: submission } = submissionResult;
    const { data: days, error: daysError } = daysResult;

    if (daysError) {
      console.error('Error fetching attendance days:', daysError);
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }

    return NextResponse.json({
      hasSubmission: !!submission,
      submission,
      days: days || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workerId, month, year, days } = body as {
      workerId: string;
      month: number;
      year: number;
      days: AttendanceDay[];
    };

    if (!workerId || !month || !year || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json({ error: 'Invalid attendance submission payload' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Strictly enforce server-side lock check
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'link_locked')
      .single();

    if (setting?.value === 'true') {
      return NextResponse.json(
        { error: 'Attendance submission is currently closed. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // 2. Validate days
    for (const d of days) {
      if (d.attendance_status === 'Present') {
        if (!d.time_arrive || !d.time_leave) {
          return NextResponse.json(
            { error: `Time in and Time out are required for Present days (${d.attendance_date}).` },
            { status: 400 }
          );
        }
      }
    }

    // 3. Atomically upsert submission
    const { data: subData, error: subError } = await supabase
      .from('submissions')
      .upsert(
        {
          worker_id: workerId,
          month,
          year,
          status: 'Completed',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'worker_id,month,year' }
      )
      .select()
      .single();

    if (subError) {
      console.error('Submission upsert error:', subError);
      return NextResponse.json({ error: 'Failed to record monthly submission' }, { status: 500 });
    }

    // Update saved dates in place; keep existing records if saving fails.
    const rowsToInsert = days.map((d) => ({
      worker_id: workerId,
      attendance_date: d.attendance_date,
      month,
      year,
      attendance_status: d.attendance_status,
      time_arrive: d.attendance_status === 'Present' ? d.time_arrive : null,
      time_leave: d.attendance_status === 'Present' ? d.time_leave : null,
      keterangan: d.keterangan || '',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from('attendance').upsert(rowsToInsert, { onConflict: 'worker_id,attendance_date' });

    if (insertError) {
      console.error('Attendance insert error:', insertError);
      return NextResponse.json({ error: 'Failed to record daily attendance records' }, { status: 500 });
    }

    return NextResponse.json({ success: true, submissionId: subData.id });
  } catch (error: any) {
    console.error('Public attendance post error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
