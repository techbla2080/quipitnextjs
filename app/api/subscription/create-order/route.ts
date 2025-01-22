// app/api/subscription/create-order/route.ts
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await razorpay.orders.create({
      amount: 99900,  // Amount in paise (₹999)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { userId },
      payment_capture: true
    });

    return NextResponse.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: 999,  // Display amount in rupees
      order_id: order.id
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create order'
    }, { status: 500 });
  }
}