import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Get Resend API key from environment variable
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('RESEND_API_KEY is not configured in environment variables');
}

const resend = new Resend(resendApiKey);

export async function POST(request: Request) {
  try {
    const { to, subject, text, html } = await request.json();

    if (!resendApiKey) {
      console.error('Email not sent: RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: 'Missing required email fields' },
        { status: 400 }
      );
    }

    const data = await resend.emails.send({
      from: 'Storiats Support <support@storiats.com>',
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 