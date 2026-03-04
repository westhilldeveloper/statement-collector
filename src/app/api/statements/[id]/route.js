// app/api/statements/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma, cloudinary } from '../../../../../lib/config';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Get statement
    const statement = await prisma.statement.findUnique({
      where: { id }
    });

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(statement.publicId, {
        resource_type: 'raw'
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion failed:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await prisma.statement.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Statement deleted successfully'
    });

  } catch (error) {
    console.error('Deletion failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete statement' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { customerId } = params;
    
    const statements = await prisma.statement.findMany({
      where: { 
        customerId: customerId 
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: statements
    });

  } catch (error) {
    console.error('Failed to fetch statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    );
  }
}
