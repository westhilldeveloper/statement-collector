// app/api/statements/reject/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/config';
// import { sendWhatsAppMessage } from '../../../../../lib/whatsapp';
import { sendRejectionEmail } from '../../../../../lib/email';

export async function POST(request) {
  try {
    const { statementId, reason } = await request.json();

    // Get statement with customer details
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: { customer: true }
    });

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Update statement status
    await prisma.statement.update({
      where: { id: statementId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedAt: new Date(),
      },
    });

    const warnings = [];

    // Send rejection WhatsApp
    // try {
    //   await sendRejectionWhatsApp(
    //     statement.customer.phone,
    //     statement.customer.name,
    //     reason
    //   );
    // } catch (whatsappError) {
    //   warnings.push(`WhatsApp failed: ${whatsappError.message}`);
    // }

    // Send rejection Email
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

    // Create reminder record
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
    return NextResponse.json(
      { error: 'Failed to reject statement' },
      { status: 500 }
    );
  }
}