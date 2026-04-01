export interface StoreItem {
  id: string;
  name: string;
  category: "rank" | "key" | "spawner";
  price: number;
  description: string;
  rarity?: string;
  minQuantity?: number;
  maxQuantity?: number;
  bundleSize?: number;
  icon?: string;
}

export interface CartItem {
  item: StoreItem;
  quantity: number;
}

export const RANKS: StoreItem[] = [
  {
    id: "vale-plus",
    name: "Vale+",
    category: "rank",
    price: 9.99,
    description: "Premium rank with exclusive perks, commands.",
    rarity: "common",
  },

    {
    id: "expet-plus",
    name: "Expert",
    category: "rank",
    price: 99.99,
    description: "Be the expert of the SMP",
    rarity: "Mythic",
  },
];

export const KEYS: StoreItem[] = [
  { id: "key-common", name: "Common Key", category: "key", price: 1.49, description: "Opens Common Crates with basic rewards.", rarity: "Common" },
  { id: "key-gold", name: "Gold Key", category: "key", price: 2.99, description: "Opens Gold Crates with enhanced loot.", rarity: "Gold" },
  { id: "key-prime", name: "Prime Key", category: "key", price: 4.99, description: "Opens Prime Crates with rare items.", rarity: "Prime" },
  { id: "key-mythic", name: "Mythic Key", category: "key", price: 5.99, description: "Opens Vale Crates with exclusive rewards.", rarity: "Mythic" },
  { id: "key-vale", name: "Vale Key", category: "key", price: 8.99, description: "Opens Mythic Crates with legendary loot.", rarity: "Vale" },
];

export const SPAWNERS: StoreItem[] = [
  { id: "spawner-skeleton", name: "Skeleton Spawner", category: "spawner", price: 14.99, description: "Place a Skeleton spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-pig", name: "Pig Spawner", category: "spawner", price: 4.99, description: "Place a Pig spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-cow", name: "Cow Spawner", category: "spawner", price: 5.99, description: "Place a Cow spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-creeper", name: "Creeper Spawner", category: "spawner", price: 9.99, description: "Place a Creeper spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-spider", name: "Spider Spawner", category: "spawner", price: 7.49, description: "Place a Spider spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-zpiglin", name: "Zombified Piglin Spawner", category: "spawner", price: 7.99, description: "Place a Zombified Piglin spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-evoker", name: "Evoker Spawner", category: "spawner", price: 7.99, description: "Place an Evoker spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-blaze", name: "Blaze Spawner", category: "spawner", price: 12.99, description: "Place a Blaze spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-witch", name: "Witch Spawner", category: "spawner", price: 5.99, description: "Place a Witch spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-iron-golem", name: "Iron Golem Spawner", category: "spawner", price: 14.99, description: "Place an Iron Golem spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-drowned", name: "Drowned Spawner", category: "spawner", price: 9.49, description: "Place a Drowned spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-wither-skeleton", name: "Wither Skeleton Spawner", category: "spawner", price: 11.99, description: "Place a Wither Skeleton spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-panda", name: "Panda Spawner", category: "spawner", price: 12.99, description: "Place a Panda spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
  { id: "spawner-elder-guardian", name: "Elder Guardian Spawner", category: "spawner", price: 19.99, description: "Place an Elder Guardian spawner in your base. (100 spawners per bundle)", bundleSize: 100, minQuantity: 1, maxQuantity: 100 },
];

export function getRarityColor(rarity?: string): string {
  switch (rarity) {
    case "Common": return "from-gray-400 to-gray-500";
    case "Gold": return "from-yellow-400 to-amber-500";
    case "Prime": return "from-cyan-400 to-blue-500";
    case "Vale": return "from-amber-400 to-orange-500";
    case "Mythic": return "from-purple-400 to-pink-500";
    case "Premium": return "from-yellow-300 to-amber-500";
    default: return "from-gray-400 to-gray-500";
  }
}
