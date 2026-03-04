// lib/email.js
import { emailTransporter } from './config';

export async function sendCollectionEmail({ to, name, link, token }) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Please upload your bank statement',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
            .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">Bank Statement Collection</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Please upload your bank statement(s) using the secure link below:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${link}" class="button">Upload Statement</a>
              </p>
              <p><strong>Reference:</strong> ${token}</p>
              <p><strong>Expires:</strong> ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}</p>
              <hr>
              <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

export async function sendRejectionEmail(to, name, reason, fileName) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Bank Statement Requires Resubmission',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">Statement Requires Resubmission</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your uploaded statement <strong>"${fileName}"</strong> has been reviewed and requires resubmission.</p>
              <div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Reason:</strong> ${reason}</p>
              </div>
              <p>Please log in to the portal to upload a new statement.</p>
              <p style="color: #666; font-size: 12px;">Thank you for your cooperation.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Rejection email failed:', error);
    throw error;
  }
}

export async function sendReminderEmail(to, name, link) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Reminder: Bank Statement Upload Required',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">Reminder: Upload Required</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>This is a reminder that we're still waiting for your bank statement(s).</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${link}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Upload Now</a>
              </p>
              <p>If you've already uploaded, please ignore this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Reminder email failed:', error);
    throw error;
  }
}