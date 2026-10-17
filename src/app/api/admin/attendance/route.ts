import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { AttendanceDay } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET worker monthly attendance
export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const month = parseInt(searchParams.get('month') || '0', 10);
    const year = parseInt(searchParams.get('year') || '0', 10);

    if (!workerId || !month || !year) {
      return NextResponse.json({ error: 'Missing workerId, month, or year' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: worker } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .single();

    const { data: submission } = await supabase
      .from('submissions')
      .select('*')
      .eq('worker_id', workerId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    const { data: days } = await supabase
      .from('attendance')
      .select('*')
      .eq('worker_id', workerId)
      .eq('month', month)
      .eq('year', year)
      .order('attendance_date', { ascending: true });

    return NextResponse.json({
      worker,
      submission,
      days: days || [],
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// PUT admin saves corrections
export async function PUT(request: Request) {
  try {
    const session = await requireAdminSession();
    const { workerId, month, year, days, reason } = await request.json() as {
      workerId: string;
      month: number;
      year: number;
      days: AttendanceDay[];
      reason?: string;
    };

    if (!workerId || !month || !year || !Array.isArray(days)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Upsert submission
    await supabase.from('submissions').upsert(
      {
        worker_id: workerId,
        month,
        year,
        status: 'Completed',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'worker_id,month,year' }
    );

    // Delete existing attendance & reinsert
    await supabase
      .from('attendance')
      .delete()
      .eq('worker_id', workerId)
      .eq('month', month)
      .eq('year', year);

    const rows = days.map((d) => ({
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

    await supabase.from('attendance').insert(rows);

    // Add audit log
    await supabase.from('audit_logs').insert({
      action: 'ADMIN_CORRECTION',
      entity_type: 'attendance',
      entity_id: `${workerId}-${year}-${month}`,
      actor: session.username,
      details: {
        reason: reason || 'Admin manual correction',
        recordCount: days.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE reopen/delete submission
export async function DELETE(request: Request) {
  try {
    const session = await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const month = parseInt(searchParams.get('month') || '0', 10);
    const year = parseInt(searchParams.get('year') || '0', 10);

    if (!workerId || !month || !year) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    await supabase
      .from('attendance')
      .delete()
      .eq('worker_id', workerId)
      .eq('month', month)
      .eq('year', year);

    await supabase
      .from('submissions')
      .delete()
      .eq('worker_id', workerId)
      .eq('month', month)
      .eq('year', year);

    await supabase.from('audit_logs').insert({
      action: 'REOPEN_SUBMISSION',
      entity_type: 'submissions',
      entity_id: `${workerId}-${year}-${month}`,
      actor: session.username,
      details: { workerId, month, year },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
