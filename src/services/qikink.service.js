import axios from "axios";

/* ===============================
   QIKINK CONFIG (UPDATED)
================================ */
const QIKINK_BASE_URL = "https://api.qikink.com/api";

const CLIENT_ID = "806453276074784";
const QIKINK_API_KEY = "2a28a5c3a4c9601552efb84e9e83b6388c7475ab46d3706fd27eea429ecb08b1";

if (!CLIENT_ID || !QIKINK_API_KEY) {
  console.warn("⚠️ QIKINK credentials missing");
}

/* ===============================
   AXIOS INSTANCE (SWAPPED AUTH FORMAT: AccessToken|ClientId)
================================ */
const qikinkClient = axios.create({
  baseURL: QIKINK_BASE_URL,
  timeout: 20000,
  headers: {
    Authorization: `${QIKINK_API_KEY}|${CLIENT_ID}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ===============================
   BUILD LINE ITEMS
================================ */
function buildLineItems(items = []) {
  return items.map((item, index) => {
    if (!item.qikink_sku) {
      throw new Error(`items.${index}.qikink_sku missing`);
    }
    if (!item.quantity || item.quantity <= 0) {
      throw new Error(`items.${index}.quantity invalid`);
    }
    if (!item.design_url) {
      throw new Error(`items.${index}.design_url missing`);
    }

    return {
      search_from_my_products: 1,
      sku: item.qikink_sku,
      quantity: String(item.quantity),
      print_type_id: 1,
      price: "199", // TODO: Make dynamic
      designs: [
        {
          design_code: "maheshelectricals",
          width_inches: "20",
          height_inches: "20",
          placement_sku: "fr",
          design_link: item.design_url,
        },
      ],
    };
  });
}

/* ===============================
   CREATE ORDER → QIKINK
================================ */
export async function createQikinkOrder({
  order_number,
  items,
  shipping_address,
  paymentMethod = "COD",
}) {
  try {
    const payload = {
      order_number,
      qikink_shipping: 1,

      gateway: paymentMethod === "ONLINE" ? "PREPAID" : "COD",
      payment_method: paymentMethod === "ONLINE" ? "prepaid" : "cod",

      total_order_value: "199", // TODO: Calculate dynamically

      line_items: buildLineItems(items),

      shipping_address: {
        first_name: shipping_address.name?.split(" ")[0] || "Customer",
        last_name: shipping_address.name?.split(" ").slice(1).join(" ") || "",
        address1: shipping_address.address,
        phone: shipping_address.phone,
        email: shipping_address.email || "maheshelectricalscustomer@gmail.com",
        city: shipping_address.city,
        zip: shipping_address.pincode,
        province: shipping_address.state,
        country_code: "IN",
      },
    };

    const response = await qikinkClient.post("/order/create", payload);

    if (!response?.data?.order_id) {
      console.error("❌ INVALID QIKINK RESPONSE", response.data);
      throw new Error("Invalid Qikink response – no order_id");
    }

    return {
      qikink_order_id: response.data.order_id,
      status: response.data.status || "received",
      raw: response.data,
    };
  } catch (error) {
    console.error(
      "❌ QIKINK CREATE ORDER ERROR:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        "Qikink order creation failed"
    );
  }
}