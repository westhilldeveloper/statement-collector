// app/api/customers/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/config'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        statements: {
          orderBy: { uploadedAt: 'desc' }
        },
        reminders: {
          orderBy: { sentAt: 'desc' },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format dates for JSON
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      tokenExpiry: customer.tokenExpiry.toISOString(),
      uploadedAt: customer.uploadedAt?.toISOString(),
      statements: customer.statements.map(s => ({
        ...s,
        uploadedAt: s.uploadedAt.toISOString(),
        reviewedAt: s.reviewedAt?.toISOString()
      })),
      reminders: customer.reminders.map(r => ({
        ...r,
        sentAt: r.sentAt.toISOString()
      }))
    }));

    return NextResponse.json({
      success: true,
      customers: formattedCustomers
    });

  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}