import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Lazy X <noreply@maheshelectricals.in>";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://maheshelectricals.in";
const DEFAULT_IMAGE = "https://via.placeholder.com/600x600.png?text=No+Image+Available";

export async function sendAbandonedEmail({ user, product }) {
  // Safe user name
  const firstName = user?.name 
    ? user.name.trim().split(" ")[0] 
    : user?.fullName 
      ? user.fullName.trim().split(" ")[0]
      : user?.username 
        ? user.username 
        : "Customer";

  // Product details
  const productTitle = product?.title || "This Awesome Item";
  const productPrice = product?.price ? `₹${product.price.toLocaleString('en-IN')}` : "₹999";
  const comparePrice = product?.compareAtPrice ? `₹${product.compareAtPrice.toLocaleString('en-IN')}` : null;

  // Safe image
  let productImage = DEFAULT_IMAGE;
  if (Array.isArray(product?.mainImages) && product.mainImages.length > 0) {
    const firstImg = product.mainImages[0];
    if (typeof firstImg === "string" && firstImg.trim()) {
      productImage = firstImg.trim();
    }
  }

  // Product link
  const productLink = product?.slug 
    ? `${FRONTEND_URL}/product/${product.slug}`
    : `${FRONTEND_URL}/product/${product.product_id}`;

  try {
    return await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `🛒 ${firstName}, your cart misses you! Complete your order now →`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hey ${firstName}, come back to your cart!</title>
          <style>
            body { margin:0; padding:0; background:#f5f5f5; font-family:'Helvetica Neue', Arial, sans-serif; }
            a { text-decoration: none; }
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; padding: 0 10px !important; }
              .product-img { width: 100% !important; height: auto !important; }
              .btn { padding: 18px 40px !important; font-size: 20px !important; }
            }
          </style>
        </head>
        <body style="margin:0; padding:0; background-color:#f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:20px 0;">
            <tr>
              <td align="center">
                <!-- Main Container -->
                <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding:40px 30px 30px; background:#000000; color:#ffffff;">
                      <h1 style="margin:0; font-size:36px; font-weight:900; letter-spacing:1px;">Lazy X</h1>
                      <p style="margin:10px 0 0; font-size:18px; opacity:0.9;">Your cart is waiting patiently...</p>
                    </td>
                  </tr>
                  
                  <!-- Greeting & Message -->
                  <tr>
                    <td style="padding:40px 40px 20px; text-align:center;">
                      <h2 style="font-size:28px; color:#111; margin:0 0 16px; font-weight:700;">
                        Hey ${firstName}!
                      </h2>
                      <p style="font-size:18px; color:#444; line-height:1.7; margin:0 0 30px;">
                        You were just one step away from owning something awesome.<br>
                        <strong>Don't let it slip away!</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Product Showcase -->
                  <tr>
                    <td align="center" style="padding:0 40px 40px;">
                      <div style="background:#fafafa; border-radius:16px; padding:30px; box-shadow:0 8px 25px rgba(0,0,0,0.08);">
                        <img src="${productImage}" alt="${productTitle}" class="product-img" 
                             style="width:300px; height:300px; object-fit:cover; border-radius:12px; margin-bottom:24px; box-shadow:0 8px 20px rgba(0,0,0,0.1);" />
                        
                        <h3 style="font-size:24px; color:#111; margin:0 0 12px; font-weight:600;">${productTitle}</h3>
                        
                        ${comparePrice ? `
                        <p style="margin:0 0 8px; color:#888; font-size:16px;">
                          <del>${comparePrice}</del>
                        </p>` : ''}
                        
                        <p style="font-size:32px; font-weight:bold; color:#000; margin:0;">
                          ${productPrice}
                        </p>
                        
                        <p style="color:#e74c3c; font-size:16px; margin:20px 0 0; font-weight:500;">
                          ⚡ Limited stock – don't miss out!
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- CTA -->
                  <tr>
                    <td align="center" style="padding:0 40px 50px;">
                      <p style="font-size:18px; color:#555; margin:0 0 30px;">
                        Complete your purchase now before it's gone forever!
                      </p>
                      <a href="${productLink}" class="btn"
                         style="display:inline-block; padding:18px 48px; background:#000000; color:#ffffff; font-size:20px; font-weight:bold; border-radius:12px; box-shadow:0 8px 25px rgba(0,0,0,0.2);">
                        Complete Your Order →
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Benefits -->
                  <tr>
                    <td style="padding:30px 40px; background:#f9f9f9; text-align:center; border-radius:0 0 16px 16px;">
                      <p style="font-size:15px; color:#666; line-height:1.6; margin:0;">
                        🔒 Secure checkout • Free shipping on orders over ₹999<br>
                        Easy returns • 24/7 support<br><br>
                        Questions? Just reply to this email — we're here for you!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding:30px; text-align:center; font-size:13px; color:#999; background:#ffffff;">
                      <p style="margin:0 0 10px;">
                        This is a friendly reminder from Lazy X because you added items to your cart.
                      </p>
                      <p style="margin:0;">
                        <a href="#" style="color:#999; text-decoration:underline;">Unsubscribe</a> • 
                        Lazy X • <a href="${FRONTEND_URL}" style="color:#999;">${FRONTEND_URL}</a>
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send abandoned cart email:", error);
    throw error;
  }
}