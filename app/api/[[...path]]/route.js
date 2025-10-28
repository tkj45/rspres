import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET handler
export async function GET(request) {
  try {
    const { pathname, searchParams } = new URL(request.url);
    const path = pathname.replace('/api/', '');

    // Today's attendance with employee details
    if (path === 'attendance/today') {
      const today = new Date().toISOString().split('T')[0];

      const sql = `
        SELECT 
          p.pegawai_nama,
          p.pegawai_nip,
          p1.pembagian1_nama,
          p2.pembagian2_nama,
          r.scan_date_in,
          r.scan_date_out
        FROM rkp_att_log r
        JOIN pegawai p ON p.pegawai_pin = r.pin
        LEFT JOIN pembagian1 p1 ON p.pembagian1_id = p1.pembagian1_id
        LEFT JOIN pembagian2 p2 ON p.pembagian2_id = p2.pembagian2_id
        WHERE r.scan_date = ?
        ORDER BY r.scan_date_in DESC LIMIT 20
      `;

      const results = await query(sql, [today]);
      return NextResponse.json({ success: true, data: results });
    }

    // Real-time attendance logs
    if (path === 'attendance/live') {
      const limit = searchParams.get('limit') || '50';

      const sql = `
        SELECT 
          a.pin,
          a.scan_date,
          a.verifymode,
          a.inoutmode,
          p.pegawai_nama,
          p.pegawai_nip,
          b.pembagian2_nama
        FROM att_log a
        LEFT JOIN pegawai p ON a.pin = p.pegawai_pin
        INNER JOIN pembagian2 AS b ON p.pembagian2_id = b.pembagian2_id
        ORDER BY a.scan_date DESC
        LIMIT ?
      `;

      const results = await query(sql, [parseInt(limit)]);
      return NextResponse.json({ success: true, data: results });
    }

    // Statistics by category
    if (path === 'attendance/stats') {
      const today = new Date().toISOString().split('T')[0];

      // Total employees
      const totalSql = 'SELECT COUNT(*) as total FROM pegawai WHERE pegawai_status = 1';
      const totalResult = await query(totalSql);

      // Present today
      const presentSql = `
        SELECT COUNT(DISTINCT r.pin) as present
        FROM rkp_att_log r
        WHERE r.scan_date = ?
      `;
      const presentResult = await query(presentSql, [today]);

      // By pembagian1
      const pembagian1Sql = `
        SELECT 
          p.pembagian1_id,
          COUNT(*) as total,
          SUM(CASE WHEN r.pin IS NOT NULL THEN 1 ELSE 0 END) as present
        FROM pegawai p
        LEFT JOIN rkp_att_log r ON p.pegawai_pin = r.pin AND r.scan_date = ?
        WHERE p.pegawai_status = 0
        GROUP BY p.pembagian1_id
      `;
      const pembagian1Result = await query(pembagian1Sql, [today]);

      // By pembagian2
      const pembagian2Sql = `
        SELECT 
          p2.pembagian2_id,
          p2.pembagian2_nama,
          COUNT(p.pegawai_id) AS total,
          SUM(CASE WHEN r.pin IS NOT NULL THEN 1 ELSE 0 END) AS present
        FROM pembagian2 p2
        LEFT JOIN pegawai p ON p2.pembagian2_id = p.pembagian2_id AND p.pegawai_status = 0
        LEFT JOIN rkp_att_log r ON p.pegawai_pin = r.pin AND r.scan_date = ?
        GROUP BY p2.pembagian2_id, p2.pembagian2_nama
        ORDER BY p2.pembagian2_nama ASC
      `;
      const pembagian2Result = await query(pembagian2Sql, [today]);

      return NextResponse.json({
        success: true,
        data: {
          total: totalResult[0]?.total || 0,
          present: presentResult[0]?.present || 0,
          absent: (totalResult[0]?.total || 0) - (presentResult[0]?.present || 0),
          byPembagian1: pembagian1Result,
          byPembagian2: pembagian2Result
        }
      });
    }

    // All employees
    if (path === 'employees') {
      const sql = `
        SELECT
        a.pegawai_id,
        a.pegawai_pin,
        a.pegawai_nip,
        a.pegawai_nama,
        c.pembagian1_nama,
        b.pembagian2_nama,
        a.tgl_lahir,
        a.gender,
        a.tgl_mulai_kerja,
        a.pegawai_status 
        FROM
        pegawai AS a
        INNER JOIN pembagian2 AS b ON a.pembagian2_id = b.pembagian2_id
        INNER JOIN pembagian1 AS c ON a.pembagian1_id = c.pembagian1_id 
        ORDER BY
        b.pembagian2_nama, a.pegawai_nama ASC
      `;

      const results = await query(sql);
      return NextResponse.json({ success: true, data: results });
    }

    // Personal report
    if (path === 'reports/personal') {
      const pin = searchParams.get('pin');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!pin || !startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'Missing required parameters' },
          { status: 400 }
        );
      }

      const sql = `
        SELECT 
          r.pin,
          r.scan_date,
          r.scan_date_in,
          r.scan_date_out,
          p.pegawai_nama,
          p.pegawai_nip,
          p.pembagian1_id,
          p.pembagian2_id
        FROM rkp_att_log r
        LEFT JOIN pegawai p ON r.pin = p.pegawai_pin
        WHERE r.pin = ? AND r.scan_date BETWEEN ? AND ?
        ORDER BY r.scan_date DESC
      `;

      const results = await query(sql, [pin, startDate, endDate]);
      return NextResponse.json({ success: true, data: results });
    }

    // Unit report
    if (path === 'reports/unit') {
      const categoryType = searchParams.get('type') || 'pembagian1';
      const categoryId = searchParams.get('id');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!categoryId || !startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'Missing required parameters' },
          { status: 400 }
        );
      }

      const column = categoryType === 'pembagian1' ? 'pembagian1_id' : 'pembagian2_id';

      const sql = `
        SELECT 
          p.pegawai_pin,
          p.pegawai_nama,
          p.pegawai_nip,
          COUNT(DISTINCT r.scan_date) as days_present,
          GROUP_CONCAT(DISTINCT r.scan_date ORDER BY r.scan_date) as dates
        FROM pegawai p
        LEFT JOIN rkp_att_log r ON p.pegawai_pin = r.pin 
          AND r.scan_date BETWEEN ? AND ?
        WHERE p.${column} = ? AND p.pegawai_status = 0
        GROUP BY p.pegawai_pin, p.pegawai_nama, p.pegawai_nip
        ORDER BY p.pegawai_nama ASC
      `;

      const results = await query(sql, [startDate, endDate, categoryId]);
      return NextResponse.json({ success: true, data: results });
    }

    // Categories list
    if (path === 'categories/pembagian1') {
      const sql = 'SELECT DISTINCT pembagian1_id FROM pegawai WHERE pembagian1_id IS NOT NULL ORDER BY pembagian1_id';
      const results = await query(sql);
      return NextResponse.json({ success: true, data: results });
    }

    if (path === 'categories/pembagian2') {
      const sql = 'SELECT ' +
          '      p2.pembagian2_id,' +
          '      p2.pembagian2_nama,' +
          '      p2.pembagian2_ket' +
          '    FROM pembagian2 p2' +
          '    WHERE p2.pembagian2_id IS NOT NULL' +
          '    ORDER BY p2.pembagian2_nama ASC';
      const results = await query(sql);
      return NextResponse.json({ success: true, data: results });
    }

    // Test connection
    if (path === 'test') {
      const results = await query('SELECT NOW() as currentTime');
      return NextResponse.json({
        success: true,
        message: 'Database connected successfully',
        data: results
      });
    }

    return NextResponse.json(
      { success: false, error: 'Endpoint not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST handler for future use (authentication, etc.)
export async function POST(request) {
  try {
    const { pathname } = new URL(request.url);
    const path = pathname.replace('/api/', '');
    const body = await request.json();

    // Simple authentication (optional)
    if (path === 'auth/login') {
      const { username, password } = body;

      // Simple check - you can enhance this
      if (username === 'admin' && password === 'admin123') {
        return NextResponse.json({
          success: true,
          user: { username: 'admin', role: 'admin' }
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Endpoint not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
