// app/api/customer-by-token/[token]/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { token } = await params;

    const customer = await prisma.customer.findUnique({
      where: { token },
      select: {
        id: true,
        name: true,
        email: true,
        token: true,
        tokenExpiry: true,
        status: true
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid link' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (new Date() > customer.tokenExpiry) {
      return NextResponse.json(
        { error: 'Link has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}