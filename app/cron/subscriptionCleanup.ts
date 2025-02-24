import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import cron from 'node-cron';
import { Resend } from 'resend';
import { clerkClient } from "@clerk/nextjs/server";

const resend = new Resend(process.env.RESEND_API_KEY);

async function notifySubscriptionExpiring(userId: string, daysLeft: number) {
  const clerkUser = await clerkClient.users.getUser(userId);
  const userEmail = clerkUser.emailAddresses[0].emailAddress;

  if (userEmail) {
    await resend.emails.send({
      from: 'Quipit <notifications@your-domain.com>',
      to: [userEmail],
      subject: `Quipit Pro Subscription Expiring in ${daysLeft} Days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Your Quipit Pro Subscription is Expiring Soon</h1>
          <p>Your subscription will expire in ${daysLeft} days. Renew now to continue enjoying unlimited trip planning!</p>
        </div>
      `
    });
  }
}

async function checkExpiredSubscriptions() {
  await connectDB();
  
  const now = new Date();
  const expiredSubscriptions = await User.find({
    subscriptionStatus: 'pro',
    subscriptionEndDate: { $lte: now },
  });

  for (const user of expiredSubscriptions) {
    await User.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          subscriptionStatus: 'free',
          subscriptionStartDate: undefined,
          subscriptionEndDate: undefined,
        },
      }
    );
    console.log(`Subscription for user ${user.userId} has expired and reverted to free.`);
    await notifySubscriptionExpiring(user.userId, 0); // Notify of expiration
  }

  // Check for subscriptions expiring soon (e.g., in 3 days)
  const soonExpiring = await User.find({
    subscriptionStatus: 'pro',
    subscriptionEndDate: {
      $gte: now,
      $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
  });

  for (const user of soonExpiring) {
    const daysLeft = Math.ceil((user.subscriptionEndDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    await notifySubscriptionExpiring(user.userId, daysLeft);
  }
}

// Run every day at midnight
cron.schedule('0 0 * * *', checkExpiredSubscriptions);

// Optional: Run immediately on startup for any missed expirations
checkExpiredSubscriptions().catch(console.error);