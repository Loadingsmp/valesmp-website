import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StoreSection from "@/components/StoreSection";
import LoginModal from "@/components/LoginModal";
import CartModal from "@/components/CartModal";
import CheckoutModal from "@/components/CheckoutModal";
import DiscordWidget from "@/components/DiscordWidget";
import { RANKS, KEYS, SPAWNERS } from "@/lib/store";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <StoreSection id="ranks" title="Ranks" subtitle="Unlock exclusive perks and stand out from the crowd." items={RANKS} />
      <StoreSection id="keys" title="Crate Keys" subtitle="Open crates and discover amazing loot." items={KEYS} />
      <StoreSection id="spawners" title="Spawners" subtitle="Build your mob farm empire. Max 100 per spawner type." items={SPAWNERS} />
      <DiscordWidget />
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground space-y-2">
        <p>© 2026 ValeSMP. All rights reserved. Not affiliated with Mojang AB.</p>
        <p className="text-xs">This Website made by ImNowLoading</p>
      </footer>
      <LoginModal />
      <CartModal />
      <CheckoutModal />
    </div>
  );
};

export default Index;
