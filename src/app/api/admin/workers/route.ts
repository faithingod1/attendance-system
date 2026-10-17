import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
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
        employee_id: employee_id && employee_id.trim() ? employee_id.trim() : null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Create worker DB error:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An employee with this Employee ID already exists.' },
          { status: 400 }
        );
      }
      throw error;
    }

    await supabase.from('audit_logs').insert({
      action: 'CREATE_WORKER',
      entity_type: 'workers',
      entity_id: data.id,
      actor: session.username,
      details: { worker_name: worker_name.trim(), department: department.trim() },
    });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// PUT update an existing worker
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
    if (status) updatePayload.status = status.toLowerCase();
    if (employee_id !== undefined) {
      updatePayload.employee_id = employee_id && employee_id.trim() ? employee_id.trim() : null;
    }

    const { data, error } = await supabase
      .from('workers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update worker DB error:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An employee with this Employee ID already exists.' },
          { status: 400 }
        );
      }
      throw error;
    }

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

// DELETE a worker
export async function DELETE(request: Request) {
  try {
    const session = await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch worker name for audit log
    const { data: worker } = await supabase
      .from('workers')
      .select('worker_name')
      .eq('id', id)
      .maybeSingle();

    // 2. Cascade delete attendance and submissions
    await supabase.from('attendance').delete().eq('worker_id', id);
    await supabase.from('submissions').delete().eq('worker_id', id);

    // 3. Delete worker
    const { error } = await supabase.from('workers').delete().eq('id', id);
    if (error) throw error;

    // 4. Log audit entry
    await supabase.from('audit_logs').insert({
      action: 'DELETE_WORKER',
      entity_type: 'workers',
      entity_id: id,
      actor: session.username,
      details: { worker_name: worker?.worker_name || 'Unknown' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete worker error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
