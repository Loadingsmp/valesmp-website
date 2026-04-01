import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const HeroSection = () => {
  return (
    <section id="top" className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-dark">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsl(45 100% 50% / 0.3), transparent 70%)" }} />
      </div>

      <div className="relative z-10 text-center px-4">
        <motion.img
          src={logo}
          alt="ValeSMP"
          className="w-48 md:w-64 mx-auto mb-8 glow-gold"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.h1
          className="text-4xl md:text-6xl font-heading font-bold text-gradient-gold mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Official Store
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Get exclusive ranks, crate keys, and spawners for the ultimate survival experience.
        </motion.p>
        <motion.a
          href="#ranks"
          className="inline-block bg-gradient-gold text-primary-foreground font-heading font-bold text-lg px-8 py-3 rounded-lg hover:opacity-90 transition-opacity animate-pulse-gold"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Browse Store
        </motion.a>
      </div>
    </section>
  );
};

export default HeroSection;
