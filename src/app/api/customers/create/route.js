// app/api/customers/create/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/config';
import { sendWhatsAppMessage } from '../../../../../lib/whatsapp';
import { sendCollectionEmail } from '../../../../../lib/email';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const { userId, name, phone, email } = await request.json();

    // Validate required fields
    if (!userId || !name || !phone || !email) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { userId }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this ID already exists' },
        { status: 409 }
      );
    }

    // Generate unique token
    const token = uuidv4();
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 days

    // Create customer in database
    const customer = await prisma.customer.create({
      data: {
        userId,
        name,
        email,
        phone,
        token,
        tokenExpiry,
        status: 'PENDING',
      },
    });

    const collectionLink = `${process.env.NEXT_PUBLIC_APP_URL}/collect/${token}`;
    const warnings = [];

    // Send Email
    try {
      await sendCollectionEmail({
        to: email,
        name,
        link: collectionLink,
        token,
      });
      
      await prisma.customer.update({
        where: { id: customer.id },
        data: { emailSent: true },
      });
    } catch (emailError) {
      warnings.push(`Email failed: ${emailError.message}`);
    }

    // Send WhatsApp using your API
    try {
      const whatsappMessage = `Hello ${name}, please upload your bank statement(s) using this secure link`;
      // const whatsappResult = await sendWhatsAppMessage(phone, whatsappMessage, collectionLink);
      const whatsappResult = await sendWhatsAppMessage(
  phone,
  name,                
  collectionLink,      
  "Upload your bank statement securely" 
);
      if (whatsappResult.success) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { whatsappSent: true },
        });
      } else {
        warnings.push(`WhatsApp failed: ${whatsappResult.error}`);
      }
    } catch (whatsappError) {
      warnings.push(`WhatsApp failed: ${whatsappError.message}`);
    }

    // Log reminder
    await prisma.reminder.create({
      data: {
        customerId: customer.id,
        type: 'INITIAL',
        reason: 'INITIAL',
        status: warnings.length > 0 ? 'FAILED' : 'SENT',
        errorMessage: warnings.join(', ') || null,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        userId: customer.userId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      link: collectionLink,
      warnings: warnings.length > 0 ? warnings : undefined,
    });

  } catch (error) {
    console.error('Customer creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create customer', details: error.message },
      { status: 500 }
    );
  }
}