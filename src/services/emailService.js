// src/services/emailService.js
import { Resend } from "resend";

/* ===============================
   RESEND INSTANCE
================================ */
const resend = new Resend(process.env.RESEND_API_KEY);

/* ===============================
   CONSTANTS (FORCE SAFE)
================================ */
const FROM_EMAIL = "Lazy X <noreply@maheshelectricals.in>";
const FALLBACK_CUSTOMER_EMAIL = "maheshelectricalscustomer@gmail.com";

/* ===============================
   COMMON MAIL SENDER (SAFE)
================================ */
const sendMail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY missing");
    throw new Error("RESEND_API_KEY missing");
  }

  const finalTo = to || FALLBACK_CUSTOMER_EMAIL;

  const response = await resend.emails.send({
    from: process.env.EMAIL_FROM || FROM_EMAIL,
    to: [String(finalTo)],
    subject,
    html,
  });

  if (response?.error) {
    console.error("❌ Resend error:", response.error);
    throw new Error(response.error.message);
  }

  console.log(`📧 Mail sent → ${finalTo} | ${subject}`);
  return response;
};

/* ===============================
   OTP EMAIL
================================ */
export const sendOtpEmail = async (toEmail, otp) => {
  return sendMail({
    to: toEmail,
    subject: "Your Lazy X Login Code",
    html: otpTemplate(otp),
  });
};

/* ===============================
   ORDER PLACED
================================ */
export const sendOrderPlacedEmailToUser = async ({ toEmail, order }) => {
  return sendMail({
    to: toEmail || FALLBACK_CUSTOMER_EMAIL,
    subject: `Order Confirmed — ${order.order_id}`,
    html: orderPlacedTemplate(order),
  });
};

/* ===============================
   IN PRODUCTION
================================ */
export const sendOrderInProductionEmail = async ({ toEmail, order }) => {
  return sendMail({
    to: toEmail || FALLBACK_CUSTOMER_EMAIL,
    subject: `Now in Production — ${order.order_id}`,
    html: inProductionTemplate(order),
  });
};

/* ===============================
   SHIPPED
================================ */
export const sendOrderShippedEmail = async ({ toEmail, order }) => {
  return sendMail({
    to: toEmail || FALLBACK_CUSTOMER_EMAIL,
    subject: `Shipped — ${order.order_id}`,
    html: shippedTemplate(order),
  });
};

/* ===============================
   DELIVERED
================================ */
export const sendOrderDeliveredEmail = async ({ toEmail, order }) => {
  return sendMail({
    to: toEmail || FALLBACK_CUSTOMER_EMAIL,
    subject: `Delivered — ${order.order_id}`,
    html: deliveredTemplate(order),
  });
};

/* ===============================
   CANCELLED
================================ */
export const sendOrderCancelledEmail = async ({ toEmail, order }) => {
  return sendMail({
    to: toEmail || FALLBACK_CUSTOMER_EMAIL,
    subject: `Order Cancelled — ${order.order_id}`,
    html: cancelledTemplate(order),
  });
};

/* ===============================
   ADMIN ALERT
================================ */
export const sendNewOrderAlertToAdmin = async ({ order }) => {
  if (!process.env.ADMIN_EMAIL) {
    console.warn("⚠️ ADMIN_EMAIL missing, skipping admin mail");
    return;
  }

  return sendMail({
    to: process.env.ADMIN_EMAIL,
    subject: `New Order — ${order.order_id}`,
    html: adminAlertTemplate(order),
  });
};

/* =================================================
   🔥 HTML TEMPLATES (REDESIGNED FOR PREMIUM, RESPONSIVE, PROFESSIONAL LOOK)
================================================= */

// Base template with improved responsive design using fluid width, media queries, and premium styling
const baseTemplate = (body) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lazy X Email</title>
<style type="text/css">
  body { margin: 0; padding: 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #000000; }
  table { border-collapse: collapse; }
  a { color: #4caf50; text-decoration: none; }
  .button { display: inline-block; background: #4caf50; color: #ffffff; padding: 16px 48px; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; border-radius: 4px; }
  .status-badge { display: inline-block; background: #f8f9fa; border: 2px solid #4caf50; padding: 12px 24px; margin-bottom: 24px; border-radius: 4px; }
  .item-image { width: 80px; height: 80px; object-fit: cover; border: 1px solid #dee2e6; border-radius: 4px; }
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; max-width: 100% !important; }
    .padding { padding: 24px !important; }
    .item-table td { display: block; width: 100%; text-align: center !important; }
    .item-table td:first-child { margin-bottom: 12px; }
    .summary-table td { padding: 12px !important; }
  }
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff;">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <tr>
          <td class="padding" style="padding: 48px 48px 32px; text-align: center; border-bottom: 1px solid #dee2e6;">
            <img src="https://maheshelectricals.in/email/logo.png" width="120" height="auto" alt="Lazy X" style="display: block; margin: 0 auto;" />
          </td>
        </tr>
        <tr>
          <td class="padding" style="padding: 48px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 48px; border-top: 1px solid #dee2e6; text-align: center;">
            <p style="margin: 0 0 16px; color: #6c757d; font-size: 13px; line-height: 20px;">Follow us for drops and updates</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 8px;"><a href="https://www.instagram.com/maheshelectricals.in?igsh=dG9xMDY4N3JoeTVn" style="color: #4caf50; text-decoration: none; font-size: 13px; font-weight: 500;">Instagram</a></td>
                <td style="padding: 0 8px; color: #adb5bd;">|</td>
                <td style="padding: 0 8px;"><a href="https://maheshelectricals.in" style="color: #4caf50; text-decoration: none; font-size: 13px; font-weight: 500;">Website</a></td>
              </tr>
            </table>
            <p style="margin: 24px 0 0; color: #adb5bd; font-size: 12px; line-height: 18px;">© ${new Date().getFullYear()} Lazy X. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;

const otpTemplate = (otp) =>
  baseTemplate(`
    <div style="text-align: center;">
      <h1 style="margin: 0 0 16px; color: #000000; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Your Login Code</h1>
      <p style="margin: 0 0 32px; color: #6c757d; font-size: 15px; line-height: 24px;">Enter this code to access your account. Valid for 10 minutes.</p>
      <div class="status-badge">
        <span style="color: #4caf50; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
      </div>
    </div>
  `);

const orderPlacedTemplate = (order) =>
  baseTemplate(`
    <div style="text-align: center; margin: 0 0 40px;">
      <h1 style="margin: 0 0 12px; color: #000000; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">Order Confirmed</h1>
      <p style="margin: 0; color: #4caf50; font-size: 16px; font-weight: 500;">#${order.order_id}</p>
    </div>

    <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 32px; margin: 0 0 32px; border-radius: 4px;">
      <p style="margin: 0 0 8px; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Shipping To</p>
      <p style="margin: 0 0 4px; color: #000000; font-size: 16px; font-weight: 500;">${order.shippingAddress.name}</p>
      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 22px;">${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}</p>
      ${order.shippingAddress.phone ? `<p style="margin: 12px 0 0; color: #495057; font-size: 14px;">${order.shippingAddress.phone}</p>` : ""}
    </div>

    <div style="margin: 0 0 32px;">
      <p style="margin: 0 0 20px; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Order Items</p>
      ${order.items
        .map(
          (item) => `
        <table class="item-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px;">
          <tr>
            <td width="80" style="padding: 0 16px 0 0; vertical-align: top;">
              ${item.image_url ? `<img src="${item.image_url}" class="item-image" alt="${item.title}" style="display: block;" />` : `<div style="width: 80px; height: 80px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;"></div>`}
            </td>
            <td style="vertical-align: top;">
              <p style="margin: 0 0 6px; color: #000000; font-size: 15px; font-weight: 500;">${item.title}</p>
              <p style="margin: 0 0 8px; color: #6c757d; font-size: 13px;">Size: ${item.size} • Qty: ${item.quantity}</p>
              <p style="margin: 0; color: #4caf50; font-size: 15px; font-weight: 600;">₹${item.price}</p>
            </td>
          </tr>
        </table>
        `
        )
        .join("")}
    </div>

    <table class="summary-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8f9fa; border: 1px solid #dee2e6; margin: 0 0 32px; border-radius: 4px;">
      <tr>
        <td style="padding: 20px 24px; border-bottom: 1px solid #dee2e6;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color: #495057; font-size: 14px;">Subtotal</td>
              <td align="right" style="color: #000000; font-size: 14px;">₹${order.subtotal || 0}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 24px; border-bottom: 1px solid #dee2e6;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color: #495057; font-size: 14px;">Shipping</td>
              <td align="right" style="color: #000000; font-size: 14px;">${order.shippingCharge === 0 ? '<span style="color: #4caf50;">FREE</span>' : `₹${order.shippingCharge}`}</td>
            </tr>
          </table>
        </td>
      </tr>
      ${order.gift_wrap ? `
      <tr>
        <td style="padding: 20px 24px; border-bottom: 1px solid #dee2e6;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color: #495057; font-size: 14px;">Gift Wrap</td>
              <td align="right" style="color: #000000; font-size: 14px;">₹${order.gift_wrap_price || 0}</td>
            </tr>
          </table>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color: #000000; font-size: 16px; font-weight: 600;">Total</td>
              <td align="right" style="color: #4caf50; font-size: 20px; font-weight: 700;">₹${order.totalAmount}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Payment Method</p>
    <p style="margin: 0 0 32px; color: #000000; font-size: 15px; font-weight: 500;">${order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</p>

    <div style="text-align: center;">
      <a href="https://maheshelectricals.in/track-order" class="button">Track Order</a>
    </div>

    <p style="margin: 32px 0 0; color: #adb5bd; font-size: 13px; line-height: 20px; text-align: center;">We'll keep you updated on your order status.</p>
  `);

const inProductionTemplate = (order) =>
  baseTemplate(`
    <div style="text-align: center; margin: 0 0 32px;">
      <div class="status-badge">
        <span style="color: #4caf50; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">In Production</span>
      </div>
      <h1 style="margin: 0 0 12px; color: #000000; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">We're Making Your Order</h1>
      <p style="margin: 0 0 8px; color: #6c757d; font-size: 15px; line-height: 24px;">Your pieces are being crafted with care.</p>
      <p style="margin: 0; color: #4caf50; font-size: 14px; font-weight: 500;">#${order.order_id}</p>
    </div>

    ${orderSummaryBlock(order)}

    <div style="text-align: center; margin: 32px 0 0;">
      <a href="https://maheshelectricals.in/orders/${order.order_id}" style="display: inline-block; background: transparent; border: 2px solid #4caf50; color: #4caf50; padding: 14px 40px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; border-radius: 4px;">View Order</a>
    </div>
  `);

const shippedTemplate = (order) =>
  baseTemplate(`
    <div style="text-align: center; margin: 0 0 32px;">
      <div class="status-badge">
        <span style="color: #4caf50; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Shipped</span>
      </div>
      <h1 style="margin: 0 0 12px; color: #000000; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">On Its Way</h1>
      <p style="margin: 0 0 8px; color: #6c757d; font-size: 15px; line-height: 24px;">Your order is en route to you.</p>
      <p style="margin: 0; color: #4caf50; font-size: 14px; font-weight: 500;">#${order.order_id}</p>
    </div>

    <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 32px; margin: 0 0 32px; text-align: center; border-radius: 4px;">
      <p style="margin: 0 0 12px; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Delivering To</p>
      <p style="margin: 0 0 4px; color: #000000; font-size: 16px; font-weight: 500;">${order.shippingAddress.name}</p>
      <p style="margin: 0; color: #495057; font-size: 14px; line-height: 22px;">${order.shippingAddress.address}, ${order.shippingAddress.city}</p>
      <p style="margin: 0; color: #495057; font-size: 14px;">${order.shippingAddress.state} ${order.shippingAddress.pincode}</p>
    </div>

    ${orderSummaryBlock(order)}

    <div style="text-align: center; margin: 32px 0 0;">
      <a href="https://maheshelectricals.in/orders/${order.order_id}" class="button">Track Shipment</a>
    </div>
  `);

const deliveredTemplate = (order) =>
  baseTemplate(`
    <div style="text-align: center; margin: 0 0 32px;">
      <div style="display: inline-block; background: #4caf50; padding: 16px 24px; margin: 0 0 24px; border-radius: 4px;">
        <span style="color: #ffffff; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Delivered</span>
      </div>
      <h1 style="margin: 0 0 12px; color: #000000; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">It's Yours</h1>
      <p style="margin: 0 0 8px; color: #6c757d; font-size: 15px; line-height: 24px;">Hope you love what you got.</p>
      <p style="margin: 0; color: #4caf50; font-size: 14px; font-weight: 500;">#${order.order_id}</p>
    </div>

    ${orderSummaryBlock(order)}

    <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 32px; margin: 32px 0 0; text-align: center; border-radius: 4px;">
      <p style="margin: 0 0 16px; color: #000000; font-size: 16px; font-weight: 500;">Show Us Your Style</p>
      <p style="margin: 0 0 24px; color: #6c757d; font-size: 14px; line-height: 22px;">Tag us on Instagram and get featured.</p>
      <a href="https://www.instagram.com/maheshelectricals.in?igsh=dG9xMDY4N3JoeTVn" style="display: inline-block; background: transparent; border: 2px solid #4caf50; color: #4caf50; padding: 14px 40px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; border-radius: 4px;">@maheshelectricals</a>
    </div>
  `);

const cancelledTemplate = (order) =>
  baseTemplate(`
    <div style="text-align: center; margin: 0 0 32px;">
      <h1 style="margin: 0 0 12px; color: #000000; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Order Cancelled</h1>
      <p style="margin: 0 0 8px; color: #6c757d; font-size: 15px; line-height: 24px;">Your order has been cancelled.</p>
      <p style="margin: 0; color: #4caf50; font-size: 14px; font-weight: 500;">#${order.order_id}</p>
    </div>

    ${orderSummaryBlock(order)}

    <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 32px; margin: 32px 0 0; text-align: center; border-radius: 4px;">
      <p style="margin: 0 0 8px; color: #000000; font-size: 16px; font-weight: 500;">Questions?</p>
      <p style="margin: 0 0 24px; color: #6c757d; font-size: 14px; line-height: 22px;">We're here to help.</p>
      <a href="mailto:support@maheshelectricals.in" style="color: #4caf50; font-size: 14px; font-weight: 500;">support@maheshelectricals.in</a>
    </div>
  `);

const adminAlertTemplate = (order) =>
  baseTemplate(`
    <div style="text-align: center; margin: 0 0 32px;">
      <div style="display: inline-block; background: #4caf50; padding: 12px 20px; margin: 0 0 20px; border-radius: 4px;">
        <span style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">New Order</span>
      </div>
      <h1 style="margin: 0 0 8px; color: #000000; font-size: 24px; font-weight: 600;">#${order.order_id}</h1>
      <p style="margin: 0; color: #4caf50; font-size: 18px; font-weight: 700;">₹${order.totalAmount}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8f9fa; border: 1px solid #dee2e6; margin: 0 0 24px; border-radius: 4px;">
      <tr>
        <td style="padding: 20px 24px; border-bottom: 1px solid #dee2e6;">
          <p style="margin: 0 0 4px; color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Customer</p>
          <p style="margin: 0; color: #000000; font-size: 15px; font-weight: 500;">${order.shippingAddress.name}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 24px; border-bottom: 1px solid #dee2e6;">
          <p style="margin: 0 0 4px; color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Phone</p>
          <p style="margin: 0; color: #000000; font-size: 15px;">${order.shippingAddress.phone || "Not provided"}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 24px; border-bottom: 1px solid #dee2e6;">
          <p style="margin: 0 0 4px; color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Address</p>
          <p style="margin: 0; color: #000000; font-size: 14px; line-height: 22px;">${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 24px;">
          <p style="margin: 0 0 4px; color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Payment</p>
          <p style="margin: 0; color: #000000; font-size: 15px; font-weight: 500;">${order.paymentMethod} • ${order.paymentStatus.toUpperCase()}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Items (${order.items.length})</p>
    ${order.items
      .map(
        (item) => `
      <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 16px; margin: 0 0 12px; border-radius: 4px;">
        <p style="margin: 0 0 4px; color: #000000; font-size: 14px; font-weight: 500;">${item.title}</p>
        <p style="margin: 0; color: #6c757d; font-size: 13px;">Size: ${item.size} • Qty: ${item.quantity} • ₹${item.price}</p>
      </div>
      `
      )
      .join("")}

    <div style="text-align: center; margin: 32px 0 0;">
      <a href="https://maheshelectricals.in/admin/orders/${order.order_id}" class="button">Open Dashboard</a>
    </div>
  `);

const orderSummaryBlock = (order) => `
  <div style="margin: 0 0 24px;">
    <p style="margin: 0 0 16px; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</p>
    ${order.items
      .map(
        (item) => `
      <table class="item-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 12px;">
        <tr>
          <td width="60" style="padding: 0 12px 0 0; vertical-align: top;">
            ${item.image_url ? `<img src="${item.image_url}" width="60" height="60" alt="${item.title}" style="display: block; border: 1px solid #dee2e6; object-fit: cover; border-radius: 4px;" />` : `<div style="width: 60px; height: 60px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;"></div>`}
          </td>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 4px; color: #000000; font-size: 14px; font-weight: 500;">${item.title}</p>
            <p style="margin: 0; color: #6c757d; font-size: 12px;">Size: ${item.size} • Qty: ${item.quantity}</p>
          </td>
          <td align="right" style="vertical-align: top; padding: 0 0 0 12px;">
            <p style="margin: 0; color: #4caf50; font-size: 14px; font-weight: 600;">₹${item.price}</p>
          </td>
        </tr>
      </table>
      `
      )
      .join("")}
  </div>

  <table class="summary-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
    <tr>
      <td style="padding: 16px 20px; border-bottom: 1px solid #dee2e6;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="color: #495057; font-size: 13px;">Subtotal</td>
            <td align="right" style="color: #000000; font-size: 13px;">₹${order.subtotal || 0}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 20px; border-bottom: 1px solid #dee2e6;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="color: #495057; font-size: 13px;">Shipping</td>
            <td align="right" style="color: #000000; font-size: 13px;">${order.shippingCharge === 0 ? '<span style="color: #4caf50;">FREE</span>' : `₹${order.shippingCharge}`}</td>
          </tr>
        </table>
      </td>
    </tr>
    ${order.gift_wrap ? `
    <tr>
      <td style="padding: 16px 20px; border-bottom: 1px solid #dee2e6;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="color: #495057; font-size: 13px;">Gift Wrap</td>
            <td align="right" style="color: #000000; font-size: 13px;">₹${order.gift_wrap_price || 0}</td>
          </tr>
        </table>
      </td>
    </tr>` : ""}
    <tr>
      <td style="padding: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="color: #000000; font-size: 15px; font-weight: 600;">Total</td>
            <td align="right" style="color: #4caf50; font-size: 18px; font-weight: 700;">₹${order.totalAmount}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;