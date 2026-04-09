import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PayPalButtons,
  PayPalCardFieldsForm,
  PayPalCardFieldsProvider,
  PayPalScriptProvider,
  usePayPalCardFields,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { useApp } from "@/context/AppContext";
import { useCurrency } from "@/context/CurrencyContext";

const API_URL = import.meta.env.VITE_API_URL;

type CartEntry = {
  item: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
};

type PayPalSectionProps = {
  apiUrl: string;
  username: string;
  cart: CartEntry[];
  cartTotal: number;
  disabled: boolean;
  processing: boolean;
  setProcessing: (value: boolean) => void;
  setError: (value: string) => void;
  setSuccessMessage: (value: string) => void;
  clearCart: () => void;
};

type CardSubmitButtonProps = {
  disabled: boolean;
  processing: boolean;
  amountLabel: string;
  setProcessing: (value: boolean) => void;
  setError: (value: string) => void;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Something went wrong.";
  }
};

const CardSubmitButton = ({
  disabled,
  processing,
  amountLabel,
  setProcessing,
  setError,
}: CardSubmitButtonProps) => {
  const { cardFields } = usePayPalCardFields() as {
    cardFields?: {
      submit?: () => Promise<unknown>;
    };
  };

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!processing) {
      setSubmitting(false);
    }
  }, [processing]);

  const handleSubmit = async () => {
    setError("");

    if (disabled || submitting || processing) {
      return;
    }

    if (!cardFields || typeof cardFields.submit !== "function") {
      setError("Card form is not ready yet. Please wait a moment and try again.");
      return;
    }

    try {
      setSubmitting(true);
      setProcessing(true);
      await cardFields.submit();
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error));
      setProcessing(false);
      setSubmitting(false);
    }
  };

  const isBusy = processing || submitting;

  return (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={disabled || isBusy}
      className="mt-4 w-full py-3 bg-yellow-500 text-black font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isBusy ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          Processing card payment...
        </>
      ) : (
        `Pay by Card — ${amountLabel}`
      )}
    </button>
  );
};

const PayPalSection = ({
  apiUrl,
  username,
  cart,
  cartTotal,
  disabled,
  processing,
  setProcessing,
  setError,
  setSuccessMessage,
  clearCart,
}: PayPalSectionProps) => {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  const createOrder = useCallback(async () => {
    const response = await fetch(`${apiUrl}/api/paypal/create-order`, {
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Failed to create PayPal order.");
    }

    if (!data?.orderId) {
      throw new Error("Missing PayPal order ID.");
    }

    return data.orderId;
  }, [apiUrl, username, cart, cartTotal]);

  const captureOrder = useCallback(
    async (orderId: string) => {
      setError("");
      setProcessing(true);

      try {
        const response = await fetch(`${apiUrl}/api/paypal/capture-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            username,
            cart,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || "Failed to capture PayPal order.");
        }

        clearCart();
        setSuccessMessage(
          data?.message ||
            "Payment completed successfully. Your items were delivered."
        );
      } catch (error) {
        console.error(error);
        setError(getErrorMessage(error));
        throw error;
      } finally {
        setProcessing(false);
      }
    },
    [apiUrl, username, cart, clearCart, setError, setProcessing, setSuccessMessage]
  );

  const handleApprove = useCallback(
    async (data: { orderID?: string; orderId?: string }) => {
      const orderId = data?.orderID || data?.orderId;

      if (!orderId) {
        throw new Error("Missing PayPal order ID after approval.");
      }

      await captureOrder(orderId);
    },
    [captureOrder]
  );

  const handleError = useCallback(
    (error: unknown) => {
      console.error(error);
      setProcessing(false);
      setError(getErrorMessage(error));
    },
    [setError, setProcessing]
  );

  if (isPending) {
    return (
      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="animate-spin" size={16} />
        Loading PayPal payment methods...
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
        Failed to load PayPal payment methods.
      </div>
    );
  }

  const amountLabel = `$${cartTotal.toFixed(2)}`;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4 bg-secondary/20">
        <p className="text-sm font-medium mb-3">PayPal</p>
        <PayPalButtons
          style={{
            layout: "vertical",
            shape: "rect",
            label: "paypal",
          }}
          disabled={disabled || processing}
          forceReRender={[cartTotal, username, cart.length]}
          createOrder={createOrder}
          onApprove={handleApprove}
          onError={handleError}
          onCancel={() => setProcessing(false)}
        />
      </div>

      <div className="rounded-lg border border-border p-4 bg-secondary/20">
        <p className="text-sm font-medium mb-3">Credit / Debit Card</p>

        <PayPalCardFieldsProvider
          createOrder={createOrder}
          onApprove={handleApprove}
          onError={handleError}
        >
          <PayPalCardFieldsForm />
          <CardSubmitButton
            disabled={disabled}
            processing={processing}
            amountLabel={amountLabel}
            setProcessing={setProcessing}
            setError={setError}
          />
        </PayPalCardFieldsProvider>

        <p className="text-xs text-muted-foreground mt-3">
          Charged in USD. Card fields only appear if your PayPal live account is
          eligible.
        </p>
      </div>
    </div>
  );
};

const CheckoutModal = () => {
  const {
    showCheckout,
    setShowCheckout,
    cart,
    cartTotal,
    username,
    clearCart,
  } = useApp();
  const { convertPrice, formatPrice } = useCurrency();

  const [clientId, setClientId] = useState("");
  const [clientIdLoading, setClientIdLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!showCheckout) {
      return;
    }

    let cancelled = false;

    const loadClientId = async () => {
      try {
        setError("");
        setClientId("");
        setClientIdLoading(true);

        if (!API_URL) {
          throw new Error("Missing VITE_API_URL environment variable.");
        }

        const response = await fetch(`${API_URL}/api/paypal/client-id`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load PayPal client ID.");
        }

        if (!data?.clientId) {
          throw new Error("PayPal client ID is missing from the backend response.");
        }

        if (!cancelled) {
          setClientId(data.clientId);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to initialize PayPal."
          );
        }
      } finally {
        if (!cancelled) {
          setClientIdLoading(false);
        }
      }
    };

    loadClientId();

    return () => {
      cancelled = true;
    };
  }, [showCheckout]);

  const paypalOptions = useMemo(() => {
    if (!clientId) {
      return undefined;
    }

    return {
      clientId,
      components: "buttons,card-fields",
      currency: "USD",
      intent: "capture",
    };
  }, [clientId]);

  const closeModal = () => {
    if (processing) {
      return;
    }

    setShowCheckout(false);
    setError("");
    setSuccessMessage("");
  };

  const displayTotal = formatPrice(convertPrice(cartTotal));
  const usdTotal = `$${cartTotal.toFixed(2)}`;
  const checkoutDisabled = !username || cart.length === 0 || cartTotal <= 0;

  return (
    <AnimatePresence>
      {showCheckout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-gold-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Checkout</h2>
              <button onClick={closeModal} disabled={processing}>
                <X size={20} />
              </button>
            </div>

            {successMessage ? (
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3">Payment Completed</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {successMessage}
                </p>
                <button
                  onClick={closeModal}
                  className="w-full py-3 bg-yellow-500 text-black font-bold rounded-lg"
                >
                  Return to Store
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary mb-4">
                  <img
                    src={`https://mc-heads.net/avatar/${username}/32`}
                    alt={username || ""}
                    className="w-8 h-8 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium">Delivering to</p>
                    <p className="text-xs text-muted-foreground">
                      {username || "Not logged in"}
                    </p>
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
                      <span>
                        {formatPrice(convertPrice(item.price * quantity))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mb-1">
                  <span>Total</span>
                  <span className="font-bold text-lg">{displayTotal}</span>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground mb-4">
                  <span>Charged in USD</span>
                  <span>{usdTotal}</span>
                </div>

                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 mb-4 text-sm text-blue-300">
                  This checkout is billed in USD.
                </div>

                {!username && (
                  <div className="text-red-500 text-sm mb-3">
                    You must log in with your Minecraft username before paying.
                  </div>
                )}

                {cart.length === 0 && (
                  <div className="text-red-500 text-sm mb-3">
                    Your cart is empty.
                  </div>
                )}

                {error && (
                  <div className="text-red-500 text-sm mb-3">{error}</div>
                )}

                {clientIdLoading || !paypalOptions ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Initializing PayPal checkout...
                  </div>
                ) : (
                  <PayPalScriptProvider options={paypalOptions}>
                    <PayPalSection
                      apiUrl={API_URL}
                      username={username || ""}
                      cart={cart as CartEntry[]}
                      cartTotal={cartTotal}
                      disabled={checkoutDisabled}
                      processing={processing}
                      setProcessing={setProcessing}
                      setError={setError}
                      setSuccessMessage={setSuccessMessage}
                      clearCart={clearCart}
                    />
                  </PayPalScriptProvider>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;