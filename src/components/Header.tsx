import { ShoppingCart, LogIn, LogOut, User } from "lucide-react";
import { useApp } from "@/context/AppContext";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";
import CurrencySelector from "./CurrencySelector";

const Header = () => {
  const { username, logout, cartCount, setShowLogin, setShowCart } = useApp();

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl"
      style={{ background: "hsla(40, 6%, 6%, 0.85)" }}
    >
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <a href="#top" className="flex items-center gap-3">
          <img src={logo} alt="ValeSMP" className="h-10 glow-gold" />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#ranks" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Ranks</a>
          <a href="#keys" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Crate Keys</a>
          <a href="#spawners" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Spawners</a>
          <a href="https://discord.gg/4nGuVV3RH5" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Discord</a>
        </nav>

        <div className="flex items-center gap-3">
          <CurrencySelector />
          {username ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                <img
                  src={`https://mc-heads.net/avatar/${username}/24`}
                  alt={username}
                  className="w-6 h-6 rounded"
                />
                <span className="text-sm font-medium text-foreground">{username}</span>
              </div>
              <button onClick={logout} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-muted transition-colors"
            >
              <LogIn size={16} />
              Login
            </button>
          )}

          <button
            onClick={() => setShowCart(true)}
            className="relative p-2 rounded-lg bg-gradient-gold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
