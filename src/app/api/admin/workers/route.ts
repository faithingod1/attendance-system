import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET all workers
export async function GET() {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('worker_name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// POST create a new worker
export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const { worker_name, department, employee_id } = await request.json();

    if (!worker_name || !department) {
      return NextResponse.json(
        { error: 'Worker name and department are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('workers')
      .insert({
        worker_name: worker_name.trim(),
        department: department.trim(),
        employee_id: employee_id ? employee_id.trim() : null,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      action: 'CREATE_WORKER',
      entity_type: 'workers',
      entity_id: data.id,
      actor: session.username,
      details: { worker_name, department },
    });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// PUT update an existing worker (e.g. status or name/department)
export async function PUT(request: Request) {
  try {
    const session = await requireAdminSession();
    const { id, worker_name, department, status, employee_id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Worker id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (worker_name) updatePayload.worker_name = worker_name.trim();
    if (department) updatePayload.department = department.trim();
    if (status) updatePayload.status = status;
    if (employee_id !== undefined) updatePayload.employee_id = employee_id ? employee_id.trim() : null;

    const { data, error } = await supabase
      .from('workers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      action: 'UPDATE_WORKER',
      entity_type: 'workers',
      entity_id: id,
      actor: session.username,
      details: updatePayload,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
