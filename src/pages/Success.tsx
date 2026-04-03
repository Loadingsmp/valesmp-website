import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type PendingCheckout = {
  username: string;
  cart: any[];
};

const Success = () => {
  const [message, setMessage] = useState("Processing your payment...");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("token");

        if (!orderId) {
          throw new Error("Missing PayPal order token.");
        }

        const stored = localStorage.getItem("pendingCheckout");

        if (!stored) {
          throw new Error("Missing pending checkout data.");
        }

        const parsed: PendingCheckout = JSON.parse(stored);

        if (!parsed?.username || !Array.isArray(parsed?.cart)) {
          throw new Error("Invalid pending checkout data.");
        }

        const res = await fetch(`${API_URL}/api/paypal/capture-and-fulfill`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            username: parsed.username,
            cart: parsed.cart,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Capture failed.");
        }

        localStorage.removeItem("pendingCheckout");
        setMessage("Payment completed successfully. Your items were delivered.");
        setDone(true);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-4">Payment Status</h1>

        {!error ? (
          <>
            <p className="text-lg mb-4">{message}</p>
            {done && (
              <a
                href="/"
                className="inline-block mt-4 px-6 py-3 rounded-lg bg-yellow-500 text-black font-bold"
              >
                Return to Store
              </a>
            )}
          </>
        ) : (
          <>
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-3 rounded-lg bg-yellow-500 text-black font-bold"
            >
              Back to Store
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default Success;