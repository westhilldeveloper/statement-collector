// app/api/statements/reject/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/config';
// import { sendWhatsAppMessage } from '../../../../../lib/whatsapp';
import { sendRejectionEmail } from '../../../../../lib/email';

export async function POST(request) {
  try {
    const { statementId, reason } = await request.json();

    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: { customer: true }
    });

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    // Mark the statement as REJECTED
    await prisma.statement.update({
      where: { id: statementId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
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

    // Send notifications (unchanged)
    const warnings = [];
    try {
      await sendRejectionEmail(
        statement.customer.email,
        statement.customer.name,
        reason,
        statement.fileName
      );
    } catch (emailError) {
      warnings.push(`Email failed: ${emailError.message}`);
    }

    await prisma.reminder.create({
      data: {
        customerId: statement.customer.id,
        type: 'REJECTION',
        reason: `Statement rejected: ${reason}`,
        status: warnings.length > 0 ? 'FAILED' : 'SENT',
        errorMessage: warnings.join(', ') || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Statement rejected and notifications sent',
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    console.error('Rejection failed:', error);
    return NextResponse.json({ error: 'Failed to reject statement' }, { status: 500 });
  }
}