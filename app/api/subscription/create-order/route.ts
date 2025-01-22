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

    console.log("Creating order with Razorpay keys:", {
      keyId: process.env.RAZORPAY_KEY_ID?.slice(0,5),  // Log first 5 chars only
    });

    const order = await razorpay.orders.create({
      amount: 999,  // ₹999 in paise
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
      payment_capture: true
    });

    console.log("Order created:", order.id);

    return NextResponse.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: 999,
      order_id: order.id
    });

  } catch (error: any) {
    console.error('Full error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}