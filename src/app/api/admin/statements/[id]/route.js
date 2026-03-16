// src/app/api/admin/statements/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/config';
import { verifyAdmin } from '../../../../../../lib/auth';

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Optional: delete from cloudinary first? We'll skip for now.

    await prisma.statement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin statement DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const statement = await prisma.statement.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, statement });
  } catch (error) {
    console.error('Admin statement GET error:', error);
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
    const { status, rejectionReason, password } = body;

    const statement = await prisma.statement.update({
      where: { id },
      data: {
        status,
        rejectionReason,
        password,
        reviewedAt: new Date(), // optionally update reviewedAt when status changes
      },
    });

    return NextResponse.json({ success: true, statement });
  } catch (error) {
    console.error('Admin statement PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}