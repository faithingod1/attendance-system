import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import ExcelJS from 'exceljs';
import { MONTH_NAMES } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '0', 10);
    const year = parseInt(searchParams.get('year') || '0', 10);
    const workerId = searchParams.get('workerId');

    if (!month || !year) {
      return NextResponse.json({ error: 'Missing month or year' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const monthName = MONTH_NAMES.en[month - 1];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Attendance Dashboard';
    workbook.created = new Date();

    if (workerId) {
      // Single worker detailed sheet
      const { data: worker } = await supabase.from('workers').select('*').eq('id', workerId).single();
      const { data: records } = await supabase
        .from('attendance')
        .select('*')
        .eq('worker_id', workerId)
        .eq('month', month)
        .eq('year', year)
        .order('attendance_date', { ascending: true });

      const worksheet = workbook.addWorksheet(`${worker?.worker_name?.slice(0, 25) || 'Worker'}`);

      // Title rows
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').value = `Monthly Attendance Record - ${monthName} ${year}`;
      worksheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF176C57' },
      };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.addRow([]);
      worksheet.addRow(['Employee Name:', worker?.worker_name, '', 'Department:', worker?.department]);
      worksheet.addRow(['Employee ID:', worker?.employee_id || '-', '', 'Status:', worker?.status]);
      worksheet.addRow([]);

      const headerRow = worksheet.addRow(['Date', 'Day', 'Status', 'Time In', 'Time Out', 'Remarks']);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE9F3EC' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      records?.forEach((rec) => {
        const d = new Date(rec.attendance_date);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const row = worksheet.addRow([
          rec.attendance_date,
          dayName,
          rec.attendance_status,
          rec.time_arrive?.slice(0, 5) || '-',
          rec.time_leave?.slice(0, 5) || '-',
          rec.keterangan || '',
        ]);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      worksheet.columns = [
        { width: 14 },
        { width: 10 },
        { width: 18 },
        { width: 12 },
        { width: 12 },
        { width: 30 },
      ];
    } else {
      // All workers summary sheet
      const { data: workers } = await supabase.from('workers').select('*').order('worker_name');
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('month', month)
        .eq('year', year);
      const { data: attendance } = await supabase
        .from('attendance')
        .select('worker_id, attendance_status')
        .eq('month', month)
        .eq('year', year);

      const subMap = new Map();
      submissions?.forEach((s) => subMap.set(s.worker_id, s));

      const countMap = new Map();
      attendance?.forEach((a) => {
        const cur = countMap.get(a.worker_id) || { present: 0, off: 0, leave: 0, total: 0 };
        cur.total += 1;
        if (a.attendance_status === 'Present') cur.present += 1;
        else if (a.attendance_status === 'Off Day') cur.off += 1;
        else cur.leave += 1;
        countMap.set(a.worker_id, cur);
      });

      const worksheet = workbook.addWorksheet(`Summary - ${monthName} ${year}`);

      worksheet.mergeCells('A1:G1');
      worksheet.getCell('A1').value = `Employee Monthly Attendance Summary - ${monthName} ${year}`;
      worksheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF176C57' },
      };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.addRow([]);
      const headerRow = worksheet.addRow([
        'Employee Name',
        'Department',
        'Submission Status',
        'Present Days',
        'Off Days',
        'Leave Days',
        'Total Logged Days',
      ]);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE9F3EC' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      workers?.forEach((w) => {
        const sub = subMap.get(w.id);
        const cnt = countMap.get(w.id) || { present: 0, off: 0, leave: 0, total: 0 };
        const row = worksheet.addRow([
          w.worker_name,
          w.department,
          sub ? sub.status : 'Pending',
          cnt.present,
          cnt.off,
          cnt.leave,
          cnt.total,
        ]);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      worksheet.columns = [
        { width: 30 },
        { width: 20 },
        { width: 20 },
        { width: 14 },
        { width: 12 },
        { width: 14 },
        { width: 18 },
      ];
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = workerId
      ? `attendance_${year}_${month}_single.xlsx`
      : `attendance_summary_${year}_${month}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
