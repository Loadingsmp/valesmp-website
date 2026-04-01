import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useCurrency, type Currency } from "@/context/CurrencyContext";

const CURRENCIES = [
  { code: "USD" as Currency, name: "US Dollar", flag: "🇺🇸", symbol: "$" },
  { code: "EUR" as Currency, name: "Euro", flag: "🇪🇺", symbol: "€" },
  { code: "GBP" as Currency, name: "British Pound", flag: "🇬🇧", symbol: "£" },
  { code: "HUF" as Currency, name: "Hungarian Forint", flag: "🇭🇺", symbol: "Ft" },
  { code: "JPY" as Currency, name: "Japanese Yen", flag: "🇯🇵", symbol: "¥" },
];

const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const currentCurrency = CURRENCIES.find(c => c.code === currency);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-secondary/50 hover:bg-secondary px-3 py-2 text-sm font-medium text-foreground transition-colors border border-border/30 hover:border-border/60"
      >
        <span className="text-lg">{currentCurrency?.flag}</span>
        <span>{currentCurrency?.code}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-56 rounded-lg border border-border bg-background shadow-lg shadow-gold/10 overflow-hidden z-40"
          >
            <div className="p-1">
              {CURRENCIES.map((curr) => (
                <motion.button
                  key={curr.code}
                  onClick={() => {
                    setCurrency(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                    currency === curr.code
                      ? "bg-gradient-gold text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-secondary"
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-xl">{curr.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{curr.code}</div>
                    <div className={`text-xs ${currency === curr.code ? "opacity-90" : "text-muted-foreground"}`}>
                      {curr.name}
                    </div>
                  </div>
                  {currency === curr.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurrencySelector;
