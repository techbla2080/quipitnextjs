// app/api/email/route.ts
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, content, type } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Quipit <notifications@your-domain.com>',
      to: [to],
      subject: subject,
      html: content
    });

    if (error) {
      return NextResponse.json({ error });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error });
  }
}