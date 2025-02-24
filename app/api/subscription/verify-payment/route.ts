import { NextResponse } from 'next/server';
import { auth, clerkClient } from "@clerk/nextjs/server";
import crypto from 'crypto';
import { Resend } from 'resend';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

const resend = new Resend(process.env.RESEND_API_KEY);

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
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    // Connect to the database
    await connectDB();

    // Update user subscription
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date(subscriptionStartDate);
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); // 30 days

    const user = await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          subscriptionStatus: 'pro',
          subscriptionStartDate,
          subscriptionEndDate,
        },
      },
      { new: true, upsert: true }
    );

    // Send confirmation email
    const clerkUser = await clerkClient.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    if (userEmail) {
      await resend.emails.send({
        from: 'Quipit <notifications@your-domain.com>',
        to: [userEmail],
        subject: 'Welcome to Quipit Pro!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to Quipit Pro!</h1>
            <p>Your subscription has been successfully activated and will expire on ${subscriptionEndDate.toLocaleDateString()}.</p>
            <p>You now have access to unlimited trip planning.</p>
            <p>Happy traveling!</p>
          </div>
        `
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 500 });
  }
}