import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User } from "lucide-react";
import { useApp } from "@/context/AppContext";

const LoginModal = () => {
  const { showLogin, setShowLogin, login } = useApp();
  const [name, setName] = useState("");
  const [preview, setPreview] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 3) {
      login(name.trim());
      setShowLogin(false);
      setName("");
      setPreview("");
    }
  };

  return (
    <AnimatePresence>
      {showLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowLogin(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-gold-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-gradient-gold">Login</h2>
              <button onClick={() => setShowLogin(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Minecraft Username</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (e.target.value.trim().length >= 3) setPreview(e.target.value.trim());
                  }}
                  placeholder="Enter your username..."
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  minLength={3}
                  maxLength={16}
                  required
                />
              </div>

              {preview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary border border-border"
                >
                  <img
                    src={`https://mc-heads.net/avatar/${preview}/48`}
                    alt={preview}
                    className="w-12 h-12 rounded-lg shadow-gold"
                  />
                  <div>
                    <p className="font-heading font-bold text-foreground">{preview}</p>
                    <p className="text-xs text-muted-foreground">Minecraft Player</p>
                  </div>
                </motion.div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-gold text-primary-foreground font-heading font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Continue as {preview || "..."}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
