import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useCurrency } from "@/context/CurrencyContext";

const CartModal = () => {
  const { showCart, setShowCart, cart, removeFromCart, updateQuantity, cartTotal, clearCart, setShowCheckout } = useApp();
  const { convertPrice, formatPrice } = useCurrency();

  return (
    <AnimatePresence>
      {showCart && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowCart(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg rounded-xl border border-border bg-card shadow-gold-lg max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-heading font-bold text-gradient-gold">Your Cart</h2>
              <button onClick={() => setShowCart(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(({ item, quantity }) => {
                    const bundleSize = item.bundleSize || 1;
                    const totalItems = quantity * bundleSize;
                    return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(convertPrice(item.price))} per {item.bundleSize || 1} ({totalItems} total)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                          <button disabled={quantity <= (item.minQuantity || 1)} onClick={() => updateQuantity(item.id, quantity - 1)} className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">-</button>
                          <span className="px-2 py-1 text-xs font-medium text-foreground">{quantity}</span>
                          <button disabled={quantity >= (item.maxQuantity || 9999)} onClick={() => updateQuantity(item.id, quantity + 1)} className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">+</button>
                        </div>
                        <span className="text-sm font-bold text-gradient-gold min-w-[3.5rem] text-right">{formatPrice(convertPrice(item.price * quantity))}</span>
                        <button onClick={() => removeFromCart(item.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-heading font-bold text-gradient-gold">{formatPrice(convertPrice(cartTotal))}</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  className="w-full bg-gradient-gold text-primary-foreground font-heading font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Proceed to Checkout
                </button>
                <button onClick={clearCart} className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors">
                  Clear Cart
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartModal;
