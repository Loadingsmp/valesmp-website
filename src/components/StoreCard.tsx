import { motion } from "framer-motion";
import { Plus, ShoppingCart } from "lucide-react";
import { StoreItem, getRarityColor } from "@/lib/store";
import { useApp } from "@/context/AppContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  item: StoreItem;
}

const StoreCard = ({ item }: Props) => {
  const { addToCart, username, setShowLogin } = useApp();
  const { convertPrice, formatPrice } = useCurrency();
  const [qty, setQty] = useState(item.minQuantity || 1);
  const { toast } = useToast();
  const rarityGradient = getRarityColor(item.rarity);
  const bundleSize = item.bundleSize || 1;
  const totalItems = qty * bundleSize;

  const handleAdd = () => {
    if (!username) {
      setShowLogin(true);
      return;
    }
    const min = item.minQuantity || 1;
    if (qty < min) {
      toast({
        title: "Invalid quantity",
        description: `Minimum quantity is ${min} bundle(s).`,
        variant: "destructive",
      });
      return;
    }
    addToCart(item, qty);
    toast({
      title: "Added to cart!",
      description: `${qty}x ${item.name} (${totalItems} total) added.`,
    });
    setQty(item.minQuantity || 1);
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-xl border border-border bg-gradient-card overflow-hidden group"
    >
      {item.rarity && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityGradient}`} />
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-heading font-bold text-lg text-foreground">{item.name}</h3>
            {item.rarity && (
              <span className={`text-xs font-semibold bg-gradient-to-r ${rarityGradient} bg-clip-text text-transparent`}>
                {item.rarity}
              </span>
            )}
          </div>
          <span className="text-gradient-gold font-heading font-bold text-xl">{formatPrice(convertPrice(item.price))}</span>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{item.description}</p>
        {item.bundleSize && <p className="text-xs text-amber-500 font-semibold mb-3">Price: {formatPrice(convertPrice(item.price))} per {item.bundleSize} spawners</p>}

        <div className="flex items-center gap-2">
          {item.maxQuantity && (
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                disabled={qty <= (item.minQuantity || 1)}
                onClick={() => setQty(q => Math.max(item.minQuantity || 1, q - 1))}
                className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                -
              </button>
              <span className="px-3 py-1 text-sm font-medium text-foreground min-w-[2rem] text-center">{qty}</span>
              <button
                disabled={qty >= (item.maxQuantity || 9999)}
                onClick={() => setQty(q => Math.min(item.maxQuantity!, q + 1))}
                className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                +
              </button>
            </div>
          )}
          <button
            onClick={handleAdd}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-gold text-primary-foreground font-semibold text-sm py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
          >
            <ShoppingCart size={14} />
            Add to Cart
          </button>
        </div>

        {item.bundleSize && (
          <p className="text-xs text-muted-foreground mt-2">Each bundle contains {item.bundleSize} spawners</p>
        )}
      </div>
    </motion.div>
  );
};

export default StoreCard;
