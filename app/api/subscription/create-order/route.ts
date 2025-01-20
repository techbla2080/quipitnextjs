import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import Razorpay from 'razorpay';

// Initialize Razorpay with proper types
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Razorpay order with proper types
    const order = await razorpay.orders.create({
      amount: 99900,  // ₹999 in paise
      currency: "INR",
      receipt: `order_${userId}_${Date.now()}`,
      payment_capture: true,  // Changed from 1 to true
      notes: {
        userId: userId
      }
    });

    if (!order || !order.id) {
      throw new Error('Failed to create order');
    }

    return NextResponse.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: 999,
      order_id: order.id,
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}