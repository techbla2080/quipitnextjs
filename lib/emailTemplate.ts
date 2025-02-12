// lib/emailTemplates.ts
export const subscriptionConfirmation = (userName: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1>Welcome to Quipit Pro!</h1>
    <p>Dear ${userName},</p>
    <p>Thank you for subscribing to Quipit Pro! Your subscription has been successfully activated.</p>
    <p>You now have access to:</p>
    <ul>
      <li>Unlimited trip planning</li>
      <li>Premium features</li>
      <li>Priority support</li>
    </ul>
    <p>Happy traveling!</p>
  </div>
`;

export const tripCreationConfirmation = (userName: string, tripDetails: any) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1>Your Trip Has Been Created!</h1>
    <p>Dear ${userName},</p>
    <p>Your trip to ${tripDetails.location} has been successfully created.</p>
    <p>Trip Details:</p>
    <ul>
      <li>Location: ${tripDetails.location}</li>
      <li>Dates: ${tripDetails.dateRange}</li>
      <li>Cities: ${tripDetails.cities.join(', ')}</li>
    </ul>
    <p>View your trip details anytime by logging into your account.</p>
  </div>
`;

export const paymentReceipt = (userName: string, amount: number) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1>Payment Receipt</h1>
    <p>Dear ${userName},</p>
    <p>We've received your payment of $${amount.toFixed(2)} for Quipit Pro subscription.</p>
    <p>Transaction Details:</p>
    <ul>
      <li>Amount: $${amount.toFixed(2)}</li>
      <li>Date: ${new Date().toLocaleDateString()}</li>
      <li>Service: Quipit Pro Monthly Subscription</li>
    </ul>
    <p>Thank you for choosing Quipit!</p>
  </div>
`;