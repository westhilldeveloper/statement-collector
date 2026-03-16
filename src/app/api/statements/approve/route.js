// app/api/statements/approve/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/config';

export async function POST(request) {
  try {
    const { statementId } = await request.json();

    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: { customer: true }
    });

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    // Mark the statement as APPROVED
    await prisma.statement.update({
      where: { id: statementId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
      },
    });

    // Get the latest statement for this customer
    const latestStatement = await prisma.statement.findFirst({
      where: { customerId: statement.customerId },
      orderBy: { uploadedAt: 'desc' },
    });

    // Set customer status based on the latest statement
    const newCustomerStatus = latestStatement?.status === 'APPROVED' ? 'APPROVED' : 'PENDING';

    await prisma.customer.update({
      where: { id: statement.customerId },
      data: { status: newCustomerStatus },
    });

    return NextResponse.json({
      success: true,
      message: 'Statement approved successfully',
    });
  } catch (error) {
    console.error('Approval failed:', error);
    return NextResponse.json({ error: 'Failed to approve statement' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // If statementId is provided, fetch specific statement
    if (statementId) {
      const statement = await prisma.statement.findUnique({
        where: { id: statementId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              userId: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!statement) {
        return NextResponse.json(
          { error: 'Statement not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        statement
      });
    }

    // Build where clause based on filters
    const where = {};
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    // Only fetch approved statements for this endpoint
    where.status = 'APPROVED';

    // Fetch multiple statements with pagination
    const [statements, totalCount] = await Promise.all([
      prisma.statement.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              userId: true,
              email: true
            }
          }
        },
        orderBy: {
          reviewedAt: 'desc'
        },
        take: limit,
        skip
      }),
      prisma.statement.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      statements,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching approved statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approved statements' },
      { status: 500 }
    );
  }
}