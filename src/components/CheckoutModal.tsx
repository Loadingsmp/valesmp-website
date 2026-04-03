import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useState } from "react";

const CheckoutModal = () => {
  const {
    showCheckout,
    setShowCheckout,
    cart,
    cartTotal,
    username,
  } = useApp();
  const { convertPrice, formatPrice } = useCurrency();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const handleCheckout = async () => {
    try {
      setError("");
      setLoading(true);

      if (!API_URL) {
        throw new Error("Missing VITE_API_URL environment variable.");
      }

      localStorage.setItem(
        "pendingCheckout",
        JSON.stringify({
          username,
          cart,
        })
      );

      const res = await fetch(`${API_URL}/api/checkout/paypal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          cart,
          total: cartTotal,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error("Backend did not return JSON.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "PayPal checkout failed.");
      }

      if (!data?.url) {
        throw new Error("Missing PayPal approval URL.");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showCheckout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => {
            if (!loading) setShowCheckout(false);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-gold-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Checkout</h2>
              <button
                onClick={() => setShowCheckout(false)}
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary mb-4">
              <img
                src={`https://mc-heads.net/avatar/${username}/32`}
                alt={username || ""}
                className="w-8 h-8 rounded"
              />
              <div>
                <p className="text-sm font-medium">Delivering to</p>
                <p className="text-xs text-muted-foreground">{username}</p>
              </div>
            </div>

            <div className="border rounded-lg divide-y mb-4">
              {cart.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex justify-between p-3 text-sm"
                >
                  <span>
                    {quantity}x {item.name}
                  </span>
                  <span>{formatPrice(convertPrice(item.price * quantity))}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between mb-4">
              <span>Total</span>
              <span className="font-bold text-lg">
                {formatPrice(convertPrice(cartTotal))}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium">Payment Method</p>
              <div className="w-full p-3 border rounded-lg bg-blue-500/10 border-blue-500 text-center font-medium">
                🅿️ PayPal
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mb-3">{error}</div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 bg-yellow-500 text-black font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Redirecting...
                </>
              ) : (
                `Continue — ${formatPrice(convertPrice(cartTotal))}`
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;