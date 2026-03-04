// app/api/stats/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/config';

export async function GET() {
  try {
    const [total, pending, completed] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'PENDING' } }),
      prisma.customer.count({ where: { status: 'APPROVED' } }),
    ]);

    return NextResponse.json({
      total,
      pending,
      completed
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}