import { NextResponse } from 'next/server';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  const body = await req.json();

  // Check for Paddle's subscription_created event
  if (body.alert_name === 'subscription_created') {
    const userEmail = body.email; // Paddle sends the user's email

    try {
      await sendConfirmationEmail(userEmail);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
  }

  // For other events, just return OK
  return NextResponse.json({ received: true });
}