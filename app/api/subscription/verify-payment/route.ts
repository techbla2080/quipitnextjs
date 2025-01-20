import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = await req.json();

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update user's subscription status
    await User.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          isSubscribed: true,
          tripCount: 0  // Reset trip count when they subscribe
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}