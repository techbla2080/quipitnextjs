// /app/api/subscription/create-order/route.ts
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import Razorpay from 'razorpay';

// Initialize Razorpay correctly
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: 99900,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { userId }
    });

    return NextResponse.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: 999,
      order_id: order.id
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}