// app/api/reminders/send/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/config';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { sendReminderEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { customerId, phone, email } = await request.json();

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { statements: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const collectionLink = `${process.env.NEXT_PUBLIC_APP_URL}/collect/${customer.token}`;
    const warnings = [];
    const sentChannels = [];

    // Send WhatsApp reminder
    try {
      const whatsappMessage = `Reminder: Please upload your bank statement(s). Some of your submissions were rejected.`;
      const whatsappResult = await sendWhatsAppMessage(phone, whatsappMessage, collectionLink);
      
      if (whatsappResult.success) {
        sentChannels.push('WhatsApp');
      } else {
        warnings.push(`WhatsApp failed: ${whatsappResult.error}`);
      }
    } catch (whatsappError) {
      warnings.push(`WhatsApp failed: ${whatsappError.message}`);
    }

    // Send Email reminder
    try {
      await sendReminderEmail(email, customer.name, collectionLink);
      sentChannels.push('Email');
    } catch (emailError) {
      warnings.push(`Email failed: ${emailError.message}`);
    }

    // Log reminder
    await prisma.reminder.create({
      data: {
        customerId,
        type: 'REMINDER',
        reason: 'REJECTION_REMINDER',
        status: warnings.length > 0 ? 'PARTIAL' : 'SENT',
        errorMessage: warnings.join(', ') || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Reminder sent',
      channels: sentChannels,
      warnings: warnings.length > 0 ? warnings : undefined,
    });

  } catch (error) {
    console.error('Reminder failed:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}