import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { WorkerSubmissionOverview, SubmissionStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '0', 10);
    const year = parseInt(searchParams.get('year') || '0', 10);

    if (!month || !year) {
      return NextResponse.json({ error: 'Missing month or year' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch link lock status
    const { data: settingData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'link_locked')
      .single();

    const isLinkLocked = settingData?.value === 'true';

    // 2. Fetch all workers
    const { data: workers, error: workerErr } = await supabase
      .from('workers')
      .select('*')
      .order('worker_name', { ascending: true });

    if (workerErr) throw workerErr;

    // 3. Fetch submissions for this month/year
    const { data: submissions, error: subErr } = await supabase
      .from('submissions')
      .select('*')
      .eq('month', month)
      .eq('year', year);

    if (subErr) throw subErr;

    // 4. Fetch attendance counts grouped by worker for this month
    const { data: attendanceList, error: attErr } = await supabase
      .from('attendance')
      .select('worker_id, attendance_status')
      .eq('month', month)
      .eq('year', year);

    if (attErr) throw attErr;

    // Build lookup maps
    const subMap = new Map<string, any>();
    submissions?.forEach((s) => subMap.set(s.worker_id, s));

    const attCountMap = new Map<string, { total: number; present: number; off: number; leave: number }>();
    attendanceList?.forEach((a) => {
      const current = attCountMap.get(a.worker_id) || { total: 0, present: 0, off: 0, leave: 0 };
      current.total += 1;
      if (a.attendance_status === 'Present') current.present += 1;
      else if (a.attendance_status === 'Off Day') current.off += 1;
      else current.leave += 1;
      attCountMap.set(a.worker_id, current);
    });

    const activeWorkers = workers?.filter((w) => w.status === 'active') || [];
    let completedCount = 0;
    let pendingCount = 0;
    let incompleteCount = 0;

    const workerOverviews: WorkerSubmissionOverview[] = (workers || []).map((w) => {
      const sub = subMap.get(w.id) || null;
      const counts = attCountMap.get(w.id) || { total: 0, present: 0, off: 0, leave: 0 };
      
      let status: SubmissionStatus = 'Pending';
      if (sub) {
        status = sub.status;
      }

      if (w.status === 'active') {
        if (status === 'Completed') completedCount++;
        else if (status === 'Incomplete') incompleteCount++;
        else pendingCount++;
      }

      return {
        worker: w,
        submission: sub,
        status,
        daysSubmitted: counts.total,
        presentDays: counts.present,
        offDays: counts.off,
        leaveDays: counts.leave,
      };
    });

    const totalActive = activeWorkers.length;
    const completionRate = totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalActiveWorkers: totalActive,
        completedSubmissions: completedCount,
        pendingSubmissions: pendingCount,
        incompleteSubmissions: incompleteCount,
        completionRate,
        isLinkLocked,
      },
      workerOverviews,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
