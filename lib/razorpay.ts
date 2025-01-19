import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const createOrder = async (amount: number) => {
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      payment_capture: 1
    });
    return order;
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    throw err;
  }
};