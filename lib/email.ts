import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(to: string) {
  return resend.emails.send({
    from: 'Your App <onboarding@resend.dev>', // Use your verified sender or domain
    to,
    subject: 'Subscription Confirmed!',
    html: `
      <h1>Thank you for subscribing!</h1>
      <p>Your subscription is now active. Welcome aboard!</p>
    `,
  });
}