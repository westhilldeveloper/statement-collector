// app/api/customers/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/config';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED, EXPIRED
    const search = searchParams.get('search'); // search in name, email, phone, userId
    const period = searchParams.get('period'); // 'today', 'week', 'month', 'year', 'all'

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Date filtering based on period (based on createdAt)
    if (period && period !== 'all') {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - now.getDay())); // start of week (Sunday)
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        where.createdAt = { gte: startDate };
      }
    }

    // Fetch customers with pagination
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          statements: {
            orderBy: { uploadedAt: 'desc' },
          },
          reminders: {
            orderBy: { sentAt: 'desc' },
            take: 5,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    // Format dates (same as before)
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      tokenExpiry: customer.tokenExpiry.toISOString(),
      statements: customer.statements.map(s => ({
        ...s,
        uploadedAt: s.uploadedAt.toISOString(),
        reviewedAt: s.reviewedAt?.toISOString(),
      })),
      reminders: customer.reminders.map(r => ({
        ...r,
        sentAt: r.sentAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      success: true,
      customers: formattedCustomers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}