// app/api/statements/by-token/[token]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/config';  // Fixed import path

export async function GET(request, { params }) {
  try {
    // ✅ Await the params Promise first
    const { token } = await params;
    
    // Now use the token value
    const customer = await prisma.customer.findUnique({
      where: { token },
      include: {
        statements: {
          orderBy: {
            uploadedAt: 'desc'
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          status: customer.status
        },
        statements: customer.statements
      }
    });

  } catch (error) {
    console.error('Failed to fetch statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    );
  }
}