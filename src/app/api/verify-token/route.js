// app/api/verify-token/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/config';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { token },
      include: {
        statements: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid link' },
        { status: 404 }
      );
    }

    if (customer.tokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Link has expired' },
        { status: 410 }
      );
    }

    // Don't send sensitive data
    const { id, name, email, phone, userId, status, statements } = customer;

    return NextResponse.json({
      success: true,
      customer: {
        id,
        name,
        email,
        phone,
        userId,
        status,
      },
      statements: statements.map(s => ({
        id: s.id,
        fileName: s.fileName,
        fileSize: s.fileSize,
        cloudinaryUrl: s.cloudinaryUrl,
        uploadedAt: s.uploadedAt,
        status: s.status,
        rejectionReason: s.rejectionReason,
      }))
    });

  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json(
      { error: 'Failed to verify link' },
      { status: 500 }
    );
  }
}