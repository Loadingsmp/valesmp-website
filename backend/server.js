import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

console.log("PAYPAL_CLIENT_ID loaded:", process.env.PAYPAL_CLIENT_ID ? "YES" : "NO");
console.log("PAYPAL_CLIENT_SECRET loaded:", process.env.PAYPAL_CLIENT_SECRET ? "YES" : "NO");
console.log("PAYPAL_BASE_URL:", process.env.PAYPAL_BASE_URL);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("STORE_BRIDGE_URL:", process.env.STORE_BRIDGE_URL);
console.log("STORE_BRIDGE_SECRET loaded:", process.env.STORE_BRIDGE_SECRET ? "YES" : "NO");

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

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

async function fulfillOrder(username, cart) {
  const storeBridgeUrl = process.env.STORE_BRIDGE_URL;
  const storeBridgeSecret = process.env.STORE_BRIDGE_SECRET;

  if (!storeBridgeUrl || !storeBridgeSecret) {
    throw new Error("Missing STORE_BRIDGE_URL or STORE_BRIDGE_SECRET in environment.");
  }

  const response = await fetch(`${storeBridgeUrl}/store/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-store-secret": storeBridgeSecret,
    },
    body: JSON.stringify({
      username,
      cart,
    }),
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "StoreBridge request failed.");
  }

  return data;
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
    throw new Error(data.error_description || data.error || "Failed to get PayPal access token.");
  }

  return data.access_token;
}

app.get("/", (_, res) => {
  res.send("Backend is running.");
});

app.get("/health", (_, res) => {
  res.json({
    ok: true,
    service: "backend",
  });
});

app.get("/api/test-store-bridge", async (_, res) => {
  try {
    const response = await fetch(`${process.env.STORE_BRIDGE_URL}/store/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-store-secret": process.env.STORE_BRIDGE_SECRET,
      },
      body: JSON.stringify({
        username: "TestUser123",
        cart: [
          {
            item: {
              name: "Vale+",
              category: "rank",
            },
            quantity: 1,
          },
        ],
      }),
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return res.status(response.status).json({
      success: response.ok,
      data,
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

app.post("/api/checkout/paypal", async (req, res) => {
  try {
    const { total, username } = req.body;

    console.log("Incoming checkout request:", req.body);

    if (!total || !username) {
      return res.status(400).json({
        error: "Missing total or username.",
      });
    }

    if (!validateMinecraftUsername(username)) {
      return res.status(400).json({
        error: "Invalid Minecraft username.",
      });
    }

    const parsedTotal = Number(total);

    if (Number.isNaN(parsedTotal) || parsedTotal <= 0) {
      return res.status(400).json({
        error: "Invalid total amount.",
      });
    }

    const accessToken = await getAccessToken();

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: parsedTotal.toFixed(2),
          },
          description: `Store purchase for ${username}`,
          custom_id: username,
        },
      ],
      application_context: {
        return_url: `${process.env.CLIENT_URL}/success`,
        cancel_url: `${process.env.CLIENT_URL}/cancel`,
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
      return res.status(500).json({
        error:
          data?.message ||
          data?.details?.[0]?.description ||
          data?.name ||
          "PayPal order creation failed.",
      });
    }

    const approveUrl = data.links?.find((link) => link.rel === "approve")?.href;

    if (!approveUrl) {
      return res.status(500).json({
        error: "No PayPal approve URL found.",
      });
    }

    return res.json({ url: approveUrl });
  } catch (error) {
    console.error("PayPal checkout error:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : "PayPal error",
    });
  }
});

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
      return res.status(500).json({
        error:
          captureData?.message ||
          captureData?.details?.[0]?.description ||
          captureData?.name ||
          "Failed to capture PayPal payment.",
      });
    }

    const status = captureData?.status;

    if (status !== "COMPLETED") {
      return res.status(400).json({
        error: `Payment not completed. Current status: ${status}`,
      });
    }

    const fulfillResult = await fulfillOrder(username, cart);

    return res.json({
      success: true,
      paymentStatus: status,
      fulfillResult,
    });
  } catch (error) {
    console.error("Capture + fulfill error:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : "Capture + fulfill failed",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});