import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/config';
import { cookies } from 'next/headers';

// Helper to verify admin (reuse the same cookie check)
async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET() {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalCustomers,
      pendingStatements,
      approvedStatements,
      rejectedStatements,
      totalReminders,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.statement.count({ where: { status: 'PENDING' } }),
      prisma.statement.count({ where: { status: 'APPROVED' } }),
      prisma.statement.count({ where: { status: 'REJECTED' } }),
      prisma.reminder.count(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        pendingStatements,
        approvedStatements,
        rejectedStatements,
        totalReminders,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}