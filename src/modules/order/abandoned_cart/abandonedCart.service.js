import AbandonedCart from "../../../models/AbandonedCart.model.js";
import { User } from "../../../models/User.model.js";
import { Product } from "../../../models/Product.model.js";
import { sendAbandonedEmail } from "../../../services/abondonedEmail.js";

/* =====================================
   ADD / MARK ABANDONED (ADD TO CART)
===================================== */
export async function markAbandonedCartService({ user_id, product_id }) {
  if (!user_id || !product_id) {
    throw new Error("user_id and product_id required");
  }

  try {
    return await AbandonedCart.create({
      user_id,
      product_id,
      status: "active",
      addedAt: new Date(),
    });
  } catch (err) {
    if (err.code === 11000) return null; // duplicate active → ignore
    throw err;
  }
}

/* =====================================
   REMOVE FROM CART (SINGLE PRODUCT)
===================================== */
export async function markAbandonedCartRemovedService({ user_id, product_id }) {
  if (!user_id || !product_id) {
    throw new Error("user_id and product_id required");
  }

  return AbandonedCart.findOneAndUpdate(
    { user_id, product_id, status: "active" },
    {
      status: "removed",
      removedAt: new Date(),
    },
    { new: true }
  );
}

/* =====================================
   CHECKOUT (ALL ACTIVE → CHECKOUT)
===================================== */
export async function markAbandonedCartCheckoutService({ user_id }) {
  if (!user_id) throw new Error("user_id required");

  return AbandonedCart.updateMany(
    { user_id, status: "active" },
    {
      status: "checkout",
      checkoutAt: new Date(),
    }
  );
}

/* =====================================
   GET USER ABANDONED CART (ACTIVE)
===================================== */
export async function getUserAbandonedCartService({ user_id }) {
  if (!user_id) throw new Error("user_id required");

  return AbandonedCart.find({
    user_id,
    status: "active",
  })
    .sort({ addedAt: -1 })
    .lean();
}


/* =====================================
   ADMIN – GET ALL ABANDONED CARTS + AUTO EMAIL + FULL USER DETAILS
===================================== */
export async function getAllAbandonedCartsService({ days }) {
  const query = {};

  if (days && Number(days) > 0) {
    query.addedAt = {
      $lte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000),
    };
  }

  const carts = await AbandonedCart.find(query)
    .sort({ addedAt: -1 })
    .lean();

  /* ===============================
     AUTO EMAIL TRIGGER (24 HOURS)
  =============================== */
  for (const cart of carts) {
    if (cart.status !== "active") continue;

    const diffHours = (Date.now() - new Date(cart.addedAt).getTime()) / 36e5;

    if (diffHours >= 24 && !cart.emailedAt) {
      const user = await User.findOne({ user_id: cart.user_id }).lean();
      const product = await Product.findOne({ product_id: cart.product_id }).lean();

      if (!user || !user.email || !product || !product.title || !product.price) {
        continue;
      }

      const productImage = Array.isArray(product.mainImages) && product.mainImages.length > 0
        ? product.mainImages[0]
        : null;

      const emailData = {
        user: {
          email: user.email,
          name: user.name || user.fullName || user.username || "Customer",
        },
        product: {
          title: product.title,
          price: product.price,
          compareAtPrice: product.compareAtPrice || null,
          image: productImage,
          slug: product.slug,
          product_id: product.product_id,
        },
      };

      try {
        await sendAbandonedEmail(emailData);

        await AbandonedCart.updateOne(
          { _id: cart._id },
          {
            status: "emailed",
            emailedAt: new Date(),
          }
        );

        console.log(`Abandoned cart email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Email send failed:", emailError);
      }
    }
  }

  // 🔄 FETCH ALL CARTS WITH FULL USER & PRODUCT DETAILS
  let allCarts = await AbandonedCart.find({})
    .sort({ addedAt: -1 })
    .lean();

  // Get unique IDs
  const uniqueUserIds = [...new Set(allCarts.map((cart) => cart.user_id))];
  const uniqueProductIds = [...new Set(allCarts.map((cart) => cart.product_id))];

  // Bulk fetch
  const users = await User.find({ user_id: { $in: uniqueUserIds } }).lean();
  const products = await Product.find({ product_id: { $in: uniqueProductIds } }).lean();

  // Maps for fast lookup
  const userMap = new Map(users.map((u) => [u.user_id, u]));
  const productMap = new Map(products.map((p) => [p.product_id, p]));

  // Enhanced carts with full details
  allCarts = allCarts.map((cart) => {
    const user = userMap.get(cart.user_id);
    const product = productMap.get(cart.product_id);

    // 🔥 EXTRACT SHIPPING ADDRESS INTELLIGENTLY
    let shippingAddress = null;

    if (user) {
      // Common possible locations of shipping address
      if (user.shippingAddress) {
        shippingAddress = user.shippingAddress;
      } else if (user.address) {
        shippingAddress = user.address;
      } else if (user.defaultAddress) {
        shippingAddress = user.defaultAddress;
      } else if (Array.isArray(user.addresses) && user.addresses.length > 0) {
        // Take first or default marked
        shippingAddress = user.addresses.find(a => a.isDefault) || user.addresses[0];
      }
    }

    return {
      ...cart,
      user: user ? {
        ...user,
        shippingAddress // Always attach this clean field for frontend
      } : null,
      product: product || null,
    };
  });

  return allCarts;
}

/* =====================================
   MARK RECOVERED (AFTER EMAIL + ORDER)
===================================== */
export async function markAbandonedCartRecoveredService({ user_id }) {
  if (!user_id) throw new Error("user_id required");

  return AbandonedCart.updateMany(
    {
      user_id,
      status: "emailed",
    },
    {
      status: "recovered",
      recoveredAt: new Date(),
    }
  );
}