import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function createRazorpayOrderService({ amount }) {
  return razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });
}

export function verifyRazorpayPaymentService({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature) {
    throw new Error("Payment verification failed");
  }

  return true;
}
