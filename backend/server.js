import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

console.log(
  "PAYPAL_CLIENT_ID loaded:",
  process.env.PAYPAL_CLIENT_ID ? "YES" : "NO"
);
console.log(
  "PAYPAL_CLIENT_SECRET loaded:",
  process.env.PAYPAL_CLIENT_SECRET ? "YES" : "NO"
);
console.log("PAYPAL_BASE_URL:", process.env.PAYPAL_BASE_URL);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("STORE_BRIDGE_URL:", process.env.STORE_BRIDGE_URL);
console.log(
  "STORE_BRIDGE_SECRET loaded:",
  process.env.STORE_BRIDGE_SECRET ? "YES" : "NO"
);

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = Array.from(
  new Set(
    [
      "http://localhost:5173",
      "https://valesmp.shop",
      "https://www.valesmp.shop",
      process.env.CLIENT_URL,
    ].filter(Boolean)
  )
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

function validateMinecraftUsername(username) {
  return typeof username === "string" && /^[A-Za-z0-9_]{3,16}$/.test(username);
}

function normalizeCart(cart) {
  if (!Array.isArray(cart)) {
    return [];
  }

  return cart
    .map((entry) => ({
      item: {
        id: String(entry?.item?.id ?? ""),
        name: String(entry?.item?.name ?? ""),
        category: String(entry?.item?.category ?? ""),
        price: Number(entry?.item?.price ?? 0),
      },
      quantity: Number(entry?.quantity ?? 0),
    }))
    .filter(
      (entry) =>
        entry.item.id &&
        entry.item.name &&
        Number.isFinite(entry.item.price) &&
        entry.item.price >= 0 &&
        Number.isFinite(entry.quantity) &&
        entry.quantity > 0
    );
}

function calculateCartTotal(cart) {
  const normalizedCart = normalizeCart(cart);

  const total = normalizedCart.reduce((sum, entry) => {
    return sum + entry.item.price * entry.quantity;
  }, 0);

  return Number(total.toFixed(2));
}

function getCheckoutTotal(body) {
  const cartTotal = calculateCartTotal(body?.cart);

  if (cartTotal > 0) {
    return cartTotal;
  }

  const fallbackTotal = Number(body?.total ?? 0);

  if (!Number.isFinite(fallbackTotal) || fallbackTotal <= 0) {
    return 0;
  }

  return Number(fallbackTotal.toFixed(2));
}

function extractErrorMessage(data, fallbackMessage) {
  return (
    data?.error_description ||
    data?.error ||
    data?.message ||
    data?.details?.[0]?.description ||
    data?.name ||
    fallbackMessage
  );
}

function isCaptureCompleted(captureData) {
  if (captureData?.status === "COMPLETED") {
    return true;
  }

  const captures = captureData?.purchase_units?.flatMap(
    (unit) => unit?.payments?.captures || []
  );

  return Array.isArray(captures)
    ? captures.some((capture) => capture?.status === "COMPLETED")
    : false;
}

async function fulfillOrder(username, cart) {
  const storeBridgeUrl = process.env.STORE_BRIDGE_URL;
  const storeBridgeSecret = process.env.STORE_BRIDGE_SECRET;

  if (!storeBridgeUrl || !storeBridgeSecret) {
    throw new Error(
      "Missing STORE_BRIDGE_URL or STORE_BRIDGE_SECRET in environment."
    );
  }

  const normalizedCart = normalizeCart(cart);

  if (normalizedCart.length === 0) {
    throw new Error("Cart is empty or invalid.");
  }

  const targetUrl = `${storeBridgeUrl}/store/claim`;
  console.log("StoreBridge target URL:", targetUrl);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-store-secret": storeBridgeSecret,
      },
      body: JSON.stringify({
        username,
        cart: normalizedCart,
      }),
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    console.log("StoreBridge response status:", response.status);
    console.log("StoreBridge response body:", data);

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `StoreBridge request failed with status ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error("StoreBridge fetch crashed:", {
      message: error instanceof Error ? error.message : String(error),
      cause:
        error instanceof Error && "cause" in error ? error.cause : undefined,
      targetUrl,
    });

    throw new Error(
      error instanceof Error ? error.message : "Unknown StoreBridge fetch error"
    );
  }
}

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = process.env.PAYPAL_BASE_URL;

  if (!clientId || !clientSecret || !baseUrl) {
    throw new Error("Missing PayPal environment variables.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  console.log("PayPal token response:", data);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Failed to get PayPal access token."));
  }

  return data.access_token;
}

async function createPayPalOrder({ username, total, redirectFlow = false }) {
  const accessToken = await getAccessToken();

  const orderPayload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: total.toFixed(2),
        },
        description: `Store purchase for ${username}`,
        custom_id: username,
      },
    ],
    application_context: redirectFlow
      ? {
          return_url: `${process.env.CLIENT_URL}/success`,
          cancel_url: `${process.env.CLIENT_URL}/cancel`,
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        }
      : {
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
  };

  const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(orderPayload),
  });

  const data = await response.json();
  console.log("PayPal order response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "PayPal order creation failed."));
  }

  if (!data?.id) {
    throw new Error("PayPal order was created, but no order ID was returned.");
  }

  return data;
}

async function capturePayPalOrder(orderId) {
  const accessToken = await getAccessToken();

  const captureResponse = await fetch(
    `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const captureData = await captureResponse.json();
  console.log("PayPal capture response:", JSON.stringify(captureData, null, 2));

  if (!captureResponse.ok) {
    throw new Error(
      extractErrorMessage(captureData, "Failed to capture PayPal payment.")
    );
  }

  if (!isCaptureCompleted(captureData)) {
    throw new Error(
      `Payment was captured unsuccessfully. Current status: ${
        captureData?.status || "UNKNOWN"
      }`
    );
  }

  return captureData;
}

app.get("/", (_, res) => {
  res.send("Backend is running.");
});

app.get("/health", (_, res) => {
  res.json({
    ok: true,
    service: "backend",
    paypalConfigured: Boolean(
      process.env.PAYPAL_CLIENT_ID &&
        process.env.PAYPAL_CLIENT_SECRET &&
        process.env.PAYPAL_BASE_URL
    ),
  });
});

app.get("/api/paypal/client-id", (_, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({
      error: "Missing PAYPAL_CLIENT_ID in environment.",
    });
  }

  return res.json({ clientId });
});

app.get("/api/test-store-bridge", async (_, res) => {
  try {
    const result = await fulfillOrder("TestUser123", [
      {
        item: {
          id: "vale-plus",
          name: "Vale+",
          category: "rank",
          price: 0,
        },
        quantity: 1,
      },
    ]);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("StoreBridge test error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "StoreBridge test failed",
    });
  }
});

app.post("/api/test-fulfill", async (req, res) => {
  try {
    const { username, cart } = req.body;

    if (!username || !Array.isArray(cart)) {
      return res.status(400).json({
        success: false,
        error: "Missing username or cart.",
      });
    }

    if (!validateMinecraftUsername(username)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Minecraft username.",
      });
    }

    const result = await fulfillOrder(username, cart);

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Test fulfill error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown fulfill error",
    });
  }
});

app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const { username, cart } = req.body;

    console.log("Incoming create-order request:", req.body);

    if (!username) {
      return res.status(400).json({
        error: "Missing username.",
      });
    }

    if (!validateMinecraftUsername(username)) {
      return res.status(400).json({
        error: "Invalid Minecraft username.",
      });
    }

    const normalizedCart = normalizeCart(cart);

    if (normalizedCart.length === 0) {
      return res.status(400).json({
        error: "Cart is empty or invalid.",
      });
    }

    const total = getCheckoutTotal({
      cart: normalizedCart,
      total: req.body?.total,
    });

    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({
        error: "Invalid total amount.",
      });
    }

    const order = await createPayPalOrder({
      username,
      total,
      redirectFlow: false,
    });

    return res.json({
      orderId: order.id,
    });
  } catch (error) {
    console.error("PayPal create-order error:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : "PayPal order error",
    });
  }
});

app.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { orderId, username, cart } = req.body;

    console.log("Incoming capture-order request:", req.body);

    if (!orderId || !username || !Array.isArray(cart)) {
      return res.status(400).json({
        error: "Missing orderId, username or cart.",
      });
    }

    if (!validateMinecraftUsername(username)) {
      return res.status(400).json({
        error: "Invalid Minecraft username.",
      });
    }

    const normalizedCart = normalizeCart(cart);

    if (normalizedCart.length === 0) {
      return res.status(400).json({
        error: "Cart is empty or invalid.",
      });
    }

    const captureData = await capturePayPalOrder(orderId);
    const fulfillResult = await fulfillOrder(username, normalizedCart);

    return res.json({
      success: true,
      message: "Payment completed successfully. Your items were delivered.",
      captureData,
      fulfillResult,
    });
  } catch (error) {
    console.error("PayPal capture-order error:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : "Capture + fulfill failed",
    });
  }
});

/*
  Legacy redirect flow endpoint kept for backward compatibility.
  Your new modal will not use this, but old success/cancel pages can still work.
*/
app.post("/api/checkout/paypal", async (req, res) => {
  try {
    const { username, cart } = req.body;

    console.log("Incoming legacy checkout request:", req.body);

    if (!username) {
      return res.status(400).json({
        error: "Missing username.",
      });
    }

    if (!validateMinecraftUsername(username)) {
      return res.status(400).json({
        error: "Invalid Minecraft username.",
      });
    }

    const normalizedCart = normalizeCart(cart);

    if (normalizedCart.length === 0) {
      return res.status(400).json({
        error: "Cart is empty or invalid.",
      });
    }

    const total = getCheckoutTotal({
      cart: normalizedCart,
      total: req.body?.total,
    });

    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({
        error: "Invalid total amount.",
      });
    }

    const order = await createPayPalOrder({
      username,
      total,
      redirectFlow: true,
    });

    const approveUrl = order.links?.find((link) => link.rel === "approve")?.href;

    if (!approveUrl) {
      return res.status(500).json({
        error: "No PayPal approve URL found.",
      });
    }

    return res.json({ url: approveUrl });
  } catch (error) {
    console.error("Legacy PayPal checkout error:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : "PayPal error",
    });
  }
});

/*
  Legacy redirect capture kept for backward compatibility with your old Success.tsx page.
*/
app.post("/api/paypal/capture-and-fulfill", async (req, res) => {
  try {
    const { orderId, username, cart } = req.body;

    if (!orderId || !username || !Array.isArray(cart)) {
      return res.status(400).json({
        error: "Missing orderId, username or cart.",
      });
    }

    if (!validateMinecraftUsername(username)) {
      return res.status(400).json({
        error: "Invalid Minecraft username.",
      });
    }

    const normalizedCart = normalizeCart(cart);

    if (normalizedCart.length === 0) {
      return res.status(400).json({
        error: "Cart is empty or invalid.",
      });
    }

    const captureData = await capturePayPalOrder(orderId);
    const fulfillResult = await fulfillOrder(username, normalizedCart);

    return res.json({
      success: true,
      paymentStatus: captureData?.status || "COMPLETED",
      fulfillResult,
    });
  } catch (error) {
    console.error("Legacy capture + fulfill error:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : "Capture + fulfill failed",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});