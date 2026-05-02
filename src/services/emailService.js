// src/services/emailService.js
import { Resend } from "resend";

/* ===============================
   CONFIG
================================ */
const resend = new Resend(process.env.RESEND_API_KEY);

/* ===============================
   SAFE CLEAN FUNCTION
================================ */
const clean = (val) => {
  return String(val || "")
    .replace(/[";]/g, "")
    .trim();
};

/* ===============================
   CONSTANTS (SAFE FALLBACK)
================================ */
const FROM_EMAIL = "onboarding@resend.dev";

// ✅ ALWAYS SAFE (ENV + FALLBACK)
const ADMIN_EMAIL = "maheshelecticals121@gmail.com";

/* ===============================
   COMMON MAIL SENDER (FINAL FIX)
================================ */
const sendMail = async ({ subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY missing");
    }

    const fromEmail =
      clean(process.env.EMAIL_FROM) || FROM_EMAIL;

    const toEmail = ADMIN_EMAIL;

    // ✅ VALIDATION (IMPORTANT)
    if (!toEmail || !toEmail.includes("@")) {
      throw new Error("Invalid ADMIN_EMAIL format");
    }

    console.log("📤 Sending Mail:", {
      from: fromEmail,
      to: toEmail,
    });

    const res = await resend.emails.send({
      from: fromEmail,
      to: [toEmail], // ✅ ALWAYS ADMIN ONLY
      subject,
      html,
    });

    if (res?.error) {
      console.error("❌ Resend Error:", res.error);
      throw new Error(res.error.message);
    }

    console.log("✅ Mail sent →", toEmail);
    return res;

  } catch (err) {
    console.error("❌ EMAIL FAILED:", err.message);
    throw err;
  }
};

/* ===============================
   🔥 ADMIN ORDER EMAIL (FINAL)
================================ */
export const sendNewOrderAlertToAdmin = async ({ order }) => {
  return sendMail({
    subject: `🔥 New Order - ${order.order_id}`,
    html: adminTemplate(order),
  });
};

/* ===============================
   BASE TEMPLATE
================================ */
const base = (content) => `
  <div style="font-family:Arial;padding:20px;background:#f4f6f8">
    <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:8px">
      ${content}
      <p style="margin-top:30px;font-size:12px;color:#888;text-align:center">
        © ${new Date().getFullYear()} Mahesh Electricals
      </p>
    </div>
  </div>
`;

/* ===============================
   ADMIN TEMPLATE
================================ */
const adminTemplate = (o) =>
  base(`
    <h2>🛒 New Order Received</h2>

    <p><b>Order ID:</b> ${o.order_id}</p>
    <p><b>Total:</b> ₹${o.totalAmount}</p>

    <hr/>

    <h3>👤 Customer</h3>
    <p><b>Name:</b> ${o.shippingAddress?.name}</p>
    <p><b>Phone:</b> ${o.shippingAddress?.phone}</p>
    <p><b>Address:</b> ${o.shippingAddress?.address}</p>

    <hr/>

    <h3>📦 Product</h3>
    ${
      o.items?.map(
        (i) => `
        <div style="display:flex;gap:10px;margin-bottom:10px">
          <img src="${i.image_url}" width="60" />
          <div>
            <p style="margin:0">${i.title}</p>
            <p style="margin:0;color:#555">₹${i.price}</p>
          </div>
        </div>
      `
      ).join("") || "No items"
    }

    <hr/>

    <p>📞 Call customer & confirm order</p>
  `);