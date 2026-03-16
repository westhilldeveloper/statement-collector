import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/config';
import { verifyAdmin } from '../../../../../../lib/auth';

export async function GET(request, { params }) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        statements: { orderBy: { uploadedAt: 'desc' } },
        reminders: { orderBy: { sentAt: 'desc' }, take: 10 },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Admin customer GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { userId, name, email, phone, status } = body;

    // Check if userId is being changed and is unique
    if (userId) {
      const existing = await prisma.customer.findFirst({
        where: { userId, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'User ID already in use' }, { status: 409 });
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { userId, name, email, phone, status },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Admin customer PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin customer DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}