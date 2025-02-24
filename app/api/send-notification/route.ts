import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { NextResponse } from 'next/server';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(require('../../../config/service-account.json'))
  });
}

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();

    const message = {
      notification: {
        title,
        body,
      },
      topic: 'all_users',
    };

    const response = await getMessaging().send(message);
    return NextResponse.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Error sending message' }, { status: 500 });
  }
}