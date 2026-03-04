// app/api/statements/upload/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/config';

export async function POST(request) {
  try {
    const { token, cloudinaryUrl, publicId, fileSize, fileName, mimeType } = await request.json();

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { token }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create statement record
    const statement = await prisma.statement.create({
      data: {
        customerId: customer.id,
        fileName,
        fileSize,
        cloudinaryUrl,
        publicId,
        mimeType,
        status: 'PENDING',
      },
    });

    // Check if this is a resubmission after rejection
    const rejectedStatements = await prisma.statement.findMany({
      where: {
        customerId: customer.id,
        status: 'REJECTED',
      },
    });

    // If this is a resubmission, send confirmation
    if (rejectedStatements.length > 0) {
      // You could send a notification that resubmission was received
      console.log('Resubmission received for customer:', customer.id);
    }

    return NextResponse.json({
      success: true,
      statement: {
        id: statement.id,
        fileName: statement.fileName,
        fileSize: statement.fileSize,
        cloudinaryUrl: statement.cloudinaryUrl,
        uploadedAt: statement.uploadedAt,
        status: statement.status,
      },
    });

  } catch (error) {
    console.error('Statement upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to save statement' },
      { status: 500 }
    );
  }
}