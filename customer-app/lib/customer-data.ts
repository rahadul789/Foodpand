// Local dummy content used by the customer app UI until API data is wired in.
export type Category = {
  id: string;
  label: string;
  icon: string;
  accent: string;
};

export type HighlightChip = {
  id: string;
  icon: string;
  label: string;
  color: string;
};

export type PromoCard = {
  id: string;
  title: string;
  note: string;
  bg: string;
  glow: string;
  eyebrow?: string;
  description: string;
  code?: string;
  minOrderTk?: number;
  validFor: string;
  perks: string[];
  terms: string[];
};

export type DiscoverFilter = {
  id: "all" | "rating-3" | "rating-4" | "under-30" | "offers";
  label: string;
  color: string;
  icon: string;
};

export type RestaurantThresholdOffer = {
  minOrderTk: number;
  discountTk: number;
};

export type RestaurantOffer = {
  type:
    | "voucher"
    | "threshold_discount"
    | "free_delivery"
    | "flat_discount"
    | "percentage_discount"
    | "item_discount"
    | "category_discount"
    | "buy_x_get_y";
  title: string;
  shortLabel?: string;
  description?: string;
  code?: string;
  minOrderTk?: number;
  discountTk?: number;
  discountPercent?: number;
  maxDiscountTk?: number;
  freeDelivery?: boolean;
  isAutoApply?: boolean;
  isActive?: boolean;
  stackable?: boolean;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  deliveryTime: string;
  rating: number;
  distance: string;
  accent: string;
  icon: string;
  priceLevel: string;
  tags: string[];
  address: string;
  heroTitle: string;
  heroSubtitle: string;
  coverImage: string;
  startingPrice: number;
  latitude: number;
  longitude: number;
  featured?: boolean;
  voucher?: string | null;
  thresholdOffer?: RestaurantThresholdOffer | null;
  offers?: RestaurantOffer[];
  menu: MenuItem[];
};

export type MenuItemAddon = {
  id: string;
  label: string;
  priceModifier: number;
  popular?: boolean;
};

export type MenuItemAddonGroup = {
  id: string;
  title: string;
  maxSelect?: number;
  optionalLabel?: string;
  description?: string;
  items: MenuItemAddon[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  accent: string;
  icon: string;
  category?: string;
  optionGroups?: MenuItemOptionGroup[];
  detail?: MenuItemDetail;
  popular?: boolean;
};

export type MenuItemOptionGroup = {
  id: string;
  title: string;
  required?: boolean;
  choices: MenuItemOptionChoice[];
};

export type MenuItemOptionChoice = {
  id: string;
  label: string;
  priceModifier?: number;
};

export type MenuItemBundleSuggestion = {
  id: string;
  label: string;
  priceModifier: number;
  accent: string;
  icon: string;
};

export type MenuItemDetail = {
  image: string;
  subtitle?: string;
  addonGroups?: MenuItemAddonGroup[];
  bundleSuggestions?: MenuItemBundleSuggestion[];
  instructionsPlaceholder?: string;
  maxInstructionsLength?: number;
};

export type ItemConfiguration = {
  selectedOptions?: Array<{
    groupId: string;
    choiceId: string;
  }>;
  selectedAddons?: Array<{
    groupId: string;
    itemIds: string[];
  }>;
  selectedBundleSuggestionIds?: string[];
};

export type Order = {
  id: string;
  orderCode?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantCoverImage?: string;
  status:
    | "Pending acceptance"
    | "Preparing"
    | "Ready for pickup"
    | "On the way"
    | "Delivered"
    | "Cancelled";
  eta: string;
  total: number;
  subtotalTk: number;
  deliveryTk: number;
  serviceFeeTk: number;
  discountTk: number;
  couponCode?: string;
  appliedOffer?: {
    type: string;
    title: string;
    shortLabel?: string;
    code?: string;
    discountTk: number;
    freeDeliveryApplied?: boolean;
    isAutoApply?: boolean;
  };
  accent: string;
  icon: string;
  items: string[];
  lineItems: Array<{
    id: string;
    itemId: string;
    name: string;
    quantity: number;
    unitTk: number;
    summary?: string;
    configuration?: ItemConfiguration;
  }>;
  paymentMethod: "COD" | "bKash";
  placedAt: string;
  deliveryAddress: string;
  deliveryLocation?: {
    label?: string;
    subtitle?: string;
    latitude: number;
    longitude: number;
  };
  note?: string;
  canTrack?: boolean;
  riderName?: string;
  deliveryTransportMode?: "bicycle" | "motorbike" | "car";
  deliveryLiveLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt?: string;
  };
  prepareMinMinutes?: number;
  prepareMaxMinutes?: number;
  estimatedReadyAt?: string;
  restaurantAcceptedAt?: string;
  readyForPickupAt?: string;
  deliveryAcceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  statusHistory?: Array<{
    status: Order["status"];
    actorRole: "customer" | "restaurant_owner" | "delivery_partner" | "admin";
    note?: string;
    createdAt: string;
  }>;
};

export const categories: Category[] = [
  { id: "1", label: "Burger", icon: "fast-food-outline", accent: "#FFD9C8" },
  { id: "2", label: "Pizza", icon: "pizza-outline", accent: "#FFE5A9" },
  { id: "3", label: "Grill", icon: "restaurant-outline", accent: "#D8EDC7" },
  { id: "4", label: "Donut", icon: "cafe-outline", accent: "#F8D5EE" },
  { id: "5", label: "Sushi", icon: "fish-outline", accent: "#FFDCC7" },
  { id: "6", label: "Pasta", icon: "wine-outline", accent: "#F9E2B8" },
  { id: "7", label: "Thai", icon: "flame-outline", accent: "#FFD6BF" },
  { id: "8", label: "Salad", icon: "leaf-outline", accent: "#DDF0CF" },
  { id: "9", label: "Drinks", icon: "beer-outline", accent: "#D7E6FF" },
  { id: "10", label: "Bakery", icon: "nutrition-outline", accent: "#F7DCC8" },
  { id: "11", label: "Coffee", icon: "cafe-outline", accent: "#E8D8C6" },
  { id: "12", label: "Dessert", icon: "ice-cream-outline", accent: "#F6D7F0" },
];

export const homeQuickPicks: HighlightChip[] = [
  { id: "q1", icon: "flash-outline", label: "Fastest", color: "#FFF1C9" },
  { id: "q2", icon: "pricetag-outline", label: "Deals", color: "#DDF6FF" },
  { id: "q3", icon: "leaf-outline", label: "Healthy", color: "#E0F4D7" },
];

export const homePromos: PromoCard[] = [
  {
    id: "p1",
    title: "50TK OFF",
    note: "On your next order",
    bg: "#FF7A59",
    glow: "#FFD66B",
    eyebrow: "Starter offer",
    description:
      "A welcome-style promo for your next craving run. Use it on a qualifying cart and save instantly.",
    code: "YUMMELA",
    minOrderTk: 199,
    validFor: "Selected menu items across the app",
    perks: [
      "Flat TK 50 discount on eligible orders",
      "Works nicely for first or low-ticket carts",
      "Easy to stack into a better value meal plan later",
    ],
    terms: [
      "Minimum order TK 199",
      "One active offer at a time",
      "Applied from the cart when eligible",
    ],
  },
  {
    id: "p2",
    title: "Free delivery",
    note: "Nearby restaurants",
    bg: "#5C7CFA",
    glow: "#98F5E1",
    eyebrow: "Speedy pick",
    description:
      "Save your delivery fee on close-by favorites and make smaller orders feel more worth it.",
    code: "FREEDEL",
    minOrderTk: 0,
    validFor: "Nearby restaurants and selected delivery zones",
    perks: [
      "Delivery charge removed when available",
      "Great for quick snacks and late-night orders",
      "Best value on smaller baskets",
    ],
    terms: [
      "Availability depends on restaurant and location",
      "One active offer at a time",
      "Coupon may be disabled when another automatic offer is active",
    ],
  },
  {
    id: "p3",
    title: "Sweet deals",
    note: "Bakery and coffee",
    bg: "#FF5D8F",
    glow: "#FFD4E0",
    eyebrow: "Dessert hour",
    description:
      "Curated promo moments for coffee, bakery, and sweet cravings when you want something quick and fun.",
    minOrderTk: 149,
    validFor: "Bakery, desserts, and cafe-style menus",
    perks: [
      "Highlights sweet-category promos in one place",
      "Perfect for coffee breaks and dessert runs",
      "Makes bakery discovery more fun on home",
    ],
    terms: [
      "Availability may vary by restaurant",
      "Offer rules depend on the selected store",
      "One active offer at a time",
    ],
  },
];

export const discoverFilters: DiscoverFilter[] = [
  { id: "all", label: "All", color: "#F4F0EB", icon: "grid-outline" },
  { id: "rating-3", label: "3.0+", color: "#FFE3D8", icon: "star-outline" },
  { id: "rating-4", label: "4.0+", color: "#FFDCC7", icon: "star-half-outline" },
  { id: "under-30", label: "Under 30 min", color: "#E8EDFF", icon: "time-outline" },
  { id: "offers", label: "Offers", color: "#FFF1CC", icon: "pricetag-outline" },
];

const urbanBitesMenu: MenuItem[] = [
  {
    id: "ub-1",
    name: "Smash Burger Combo",
    description: "Double patty, cheddar, fries, and lime soda.",
    price: 12.5,
    accent: "#F5C0A9",
    icon: "fast-food",
    category: "Popular",
    detail: {
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
      subtitle: "Loaded burger combo with crowd-favorite extras.",
      addonGroups: [
        {
          id: "burger-boost",
          title: "Make it bigger",
          optionalLabel: "Optional",
          maxSelect: 3,
          description: "Select up to 3",
          items: [
            { id: "extra-cheese", label: "Extra cheddar", priceModifier: 2.2 },
            { id: "crispy-bacon", label: "Crispy bacon", priceModifier: 3.6, popular: true },
            { id: "loaded-fries", label: "Loaded fries", priceModifier: 4.2 },
          ],
        },
      ],
      bundleSuggestions: [
        {
          id: "lime-soda",
          label: "Lime soda",
          priceModifier: 3.2,
          accent: "#DDF6FF",
          icon: "wine",
        },
        {
          id: "brownie-bite",
          label: "Brownie bite",
          priceModifier: 3.8,
          accent: "#FBE2D0",
          icon: "cafe",
        },
      ],
      instructionsPlaceholder: "Less sauce, extra crispy fries, no onions...",
      maxInstructionsLength: 250,
    },
    popular: true,
  },
  {
    id: "ub-2",
    name: "Crispy Chicken Wrap",
    description: "Hot honey chicken, lettuce, pickles, and ranch.",
    price: 9.9,
    accent: "#F3D4B5",
    icon: "restaurant",
    category: "Wraps",
  },
  {
    id: "ub-3",
    name: "Loaded Fries",
    description: "Cheese sauce, jalapeno, scallions, and smoky mayo.",
    price: 6.75,
    accent: "#F0E0A4",
    icon: "nutrition",
    category: "Snacks",
  },
  {
    id: "ub-4",
    name: "Fire Chicken Roast",
    description: "Smoky roast chicken with butter glaze and house salad.",
    price: 10.75,
    accent: "#FFD6B8",
    icon: "flame",
    category: "Roast",
    detail: {
      image:
        "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80",
      subtitle: "Butter-glazed roast with room for bold add-ons.",
      addonGroups: [
        {
          id: "roast-addons",
          title: "Add ons for chicken roast",
          optionalLabel: "Optional",
          maxSelect: 5,
          description: "Select up to 5",
          items: [
            { id: "chicken-roast", label: "Extra chicken roast", priceModifier: 15 },
            { id: "jali-kebab", label: "Jali kebab", priceModifier: 6, popular: true },
            { id: "chutney", label: "Chutney", priceModifier: 2 },
            { id: "firni", label: "Firni", priceModifier: 7 },
          ],
        },
      ],
      bundleSuggestions: [
        {
          id: "borhani",
          label: "Borhani",
          priceModifier: 4.5,
          accent: "#E6F2DC",
          icon: "leaf",
        },
        {
          id: "badam-sharbat",
          label: "Badam sharbat",
          priceModifier: 6.5,
          accent: "#FFF0D2",
          icon: "cafe",
        },
        {
          id: "salad-cup",
          label: "Crunch salad cup",
          priceModifier: 4,
          accent: "#DDF5E4",
          icon: "nutrition",
        },
      ],
      instructionsPlaceholder: "Less spicy, extra gravy, pack salad separately...",
      maxInstructionsLength: 500,
    },
    popular: true,
  },
  {
    id: "ub-5",
    name: "Donut Shake",
    description: "Vanilla shake topped with mini donut crunch.",
    price: 5.5,
    accent: "#F8D5EE",
    icon: "ice-cream",
    category: "Dessert",
  },
];

const napoliMenu: MenuItem[] = [
  {
    id: "np-1",
    name: "Truffle Funghi",
    description: "Roasted mushroom, parmesan, truffle cream.",
    price: 14.25,
    accent: "#EACFAF",
    icon: "pizza",
    category: "Popular",
    optionGroups: [
      {
        id: "size",
        title: "Choose size",
        required: true,
        choices: [
          { id: "size-6", label: '6"' },
          { id: "size-8", label: '8"', priceModifier: 2 },
          { id: "size-12", label: '12"', priceModifier: 5 },
        ],
      },
      {
        id: "crust",
        title: "Crust",
        required: true,
        choices: [
          { id: "thin", label: "Thin" },
          { id: "thick", label: "Thick", priceModifier: 1.25 },
        ],
      },
    ],
    detail: {
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
      subtitle: "Woodfired pizza with customization built for sharing.",
      addonGroups: [
        {
          id: "pizza-toppings",
          title: "Finish it your way",
          optionalLabel: "Optional",
          maxSelect: 4,
          description: "Pick up to 4 toppings",
          items: [
            { id: "extra-funghi", label: "Extra mushroom", priceModifier: 2.5 },
            { id: "burrata", label: "Burrata", priceModifier: 4.5, popular: true },
            { id: "pepperoni", label: "Pepperoni", priceModifier: 3.4 },
            { id: "garlic-butter", label: "Garlic butter edge", priceModifier: 1.8 },
          ],
        },
      ],
      bundleSuggestions: [
        {
          id: "cola",
          label: "Craft cola",
          priceModifier: 3.2,
          accent: "#E8EDFF",
          icon: "wine",
        },
        {
          id: "tiramisu-shot",
          label: "Tiramisu cup",
          priceModifier: 5,
          accent: "#FFE8CC",
          icon: "ice-cream",
        },
      ],
      instructionsPlaceholder: "Light sauce, cut into squares, keep extra hot...",
      maxInstructionsLength: 300,
    },
    popular: true,
  },
  {
    id: "np-2",
    name: "Spicy Margherita",
    description: "Fresh basil, chili oil, and buffalo mozzarella.",
    price: 13.5,
    accent: "#F7C7A9",
    icon: "flame",
    category: "Pizza",
    optionGroups: [
      {
        id: "size",
        title: "Choose size",
        required: true,
        choices: [
          { id: "size-6", label: '6"' },
          { id: "size-8", label: '8"', priceModifier: 1.8 },
          { id: "size-12", label: '12"', priceModifier: 4.8 },
        ],
      },
      {
        id: "crust",
        title: "Crust",
        required: true,
        choices: [
          { id: "thin", label: "Thin" },
          { id: "stuffed", label: "Stuffed", priceModifier: 2.2 },
        ],
      },
    ],
  },
  {
    id: "np-3",
    name: "Lemon Tiramisu",
    description: "Silky mascarpone, lemon cream, and biscuit crumb.",
    price: 7.25,
    accent: "#F4E1B7",
    icon: "ice-cream",
    category: "Dessert",
  },
  {
    id: "np-4",
    name: "Creamy Alfredo Pasta",
    description: "Silky parmesan cream with garlic chicken strips.",
    price: 11.95,
    accent: "#F6E3C0",
    icon: "wine",
    category: "Pasta",
  },
  {
    id: "np-5",
    name: "Spicy Meatball Bowl",
    description: "Tomato braised meatballs with basil rice and pecorino.",
    price: 12.85,
    accent: "#F7D0B8",
    icon: "restaurant",
    category: "Bowls",
  },
];

const nourishMenu: MenuItem[] = [
  {
    id: "ng-1",
    name: "Green Goddess Bowl",
    description: "Quinoa, avocado, edamame, cucumber, and tahini.",
    price: 11.4,
    accent: "#CFE2B6",
    icon: "leaf",
    category: "Popular",
    detail: {
      image:
        "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
      subtitle: "Fresh bowl with protein and crunch add-ons.",
      addonGroups: [
        {
          id: "bowl-protein",
          title: "Boost the bowl",
          optionalLabel: "Optional",
          maxSelect: 2,
          description: "Pick up to 2",
          items: [
            { id: "grilled-chicken", label: "Grilled chicken", priceModifier: 5.5, popular: true },
            { id: "avocado", label: "Extra avocado", priceModifier: 3.2 },
            { id: "crispy-seeds", label: "Crispy seeds", priceModifier: 1.9 },
          ],
        },
      ],
      bundleSuggestions: [
        {
          id: "kombucha",
          label: "Kombucha",
          priceModifier: 4.8,
          accent: "#E0F4D7",
          icon: "beer",
        },
      ],
      instructionsPlaceholder: "Dressing on side, more cucumber, no onions...",
      maxInstructionsLength: 250,
    },
    popular: true,
  },
  {
    id: "ng-2",
    name: "Salmon Citrus Plate",
    description: "Charred salmon, orange salad, and herbed rice.",
    price: 15.8,
    accent: "#F3CEAF",
    icon: "fish",
    category: "Bowls",
  },
  {
    id: "ng-3",
    name: "Berry Chia Jar",
    description: "Overnight chia pudding with fresh berries.",
    price: 5.9,
    accent: "#E9D2F1",
    icon: "flower",
    category: "Dessert",
  },
  {
    id: "ng-4",
    name: "Mango Yogurt Parfait",
    description: "Layered yogurt, granola, mango, and honey seeds.",
    price: 6.4,
    accent: "#FFE2A8",
    icon: "cafe",
    category: "Breakfast",
  },
  {
    id: "ng-5",
    name: "Roasted Chicken Curry",
    description: "Tender chicken with turmeric rice and light coconut curry.",
    price: 12.1,
    accent: "#FFD7B7",
    icon: "flame",
    category: "Curry",
  },
];

export const dummyCategories = categories;
export const dummyRestaurants: Restaurant[] = [
  {
    id: 'urban-bites-sheikh-para',
    name: 'Urban Bites Sheikh-para',
    cuisine: 'American comfort',
    deliveryTime: '15-21 min',
    rating: 4.7,
    distance: '0.2 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Featured', 'Voucher', 'Nearby'],
    address: '14 Sheikh-para, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.8783938,
    longitude: 90.7255728,
    featured: true,
    voucher: 'TK 60 OFF',
    thresholdOffer: {
      minOrderTk: 450,
      discountTk: 50,
    },
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-nagra',
    name: 'Napoli Noir Nagra',
    cuisine: 'Woodfired pizza',
    deliveryTime: '15-22 min',
    rating: 4.9,
    distance: '0.3 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Nearby'],
    address: '15 Nagra, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.8783332,
    longitude: 90.7271541,
    featured: false,
    voucher: null,
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-college-road',
    name: 'Nourish Garden College Road',
    cuisine: 'Healthy bowls',
    deliveryTime: '15-23 min',
    rating: 4.7,
    distance: '0.3 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Voucher', 'Nearby'],
    address: '16 College Road, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8770667,
    longitude: 90.7284276,
    featured: false,
    voucher: 'Free delivery',
    thresholdOffer: {
      minOrderTk: 399,
      discountTk: 40,
    },
    menu: nourishMenu,
  },
  {
    id: 'spice-route-new-market',
    name: 'Spice Route New Market',
    cuisine: 'Comfort curry',
    deliveryTime: '15-24 min',
    rating: 4.6,
    distance: '0.4 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Nearby'],
    address: '17 New Market, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.8749737,
    longitude: 90.7288316,
    featured: false,
    voucher: null,
    thresholdOffer: {
      minOrderTk: 500,
      discountTk: 60,
    },
    menu: urbanBitesMenu,
  },
  {
    id: 'urban-bites-station-road',
    name: 'Urban Bites Station Road',
    cuisine: 'American comfort',
    deliveryTime: '16-26 min',
    rating: 4.7,
    distance: '0.5 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Featured', 'Nearby'],
    address: '18 Station Road, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.8729574,
    longitude: 90.7276123,
    featured: true,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-moktarpra',
    name: 'Napoli Noir Moktarpara',
    cuisine: 'Woodfired pizza',
    deliveryTime: '16-22 min',
    rating: 4.9,
    distance: '0.5 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Nearby'],
    address: '19 Moktarpara, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.8717671,
    longitude: 90.7247207,
    featured: false,
    voucher: null,
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-satpai',
    name: 'Nourish Garden Satpai',
    cuisine: 'Healthy bowls',
    deliveryTime: '16-23 min',
    rating: 4.7,
    distance: '0.6 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Voucher', 'Nearby'],
    address: '20 Satpai, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8719903,
    longitude: 90.7216607,
    featured: false,
    voucher: 'TK 40 OFF',
    menu: nourishMenu,
  },
  {
    id: 'spice-route-central-bazar',
    name: 'Spice Route Central Bazar',
    cuisine: 'Comfort curry',
    deliveryTime: '16-24 min',
    rating: 4.6,
    distance: '0.7 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Nearby'],
    address: '21 Central Bazar, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.8740639,
    longitude: 90.7187616,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'urban-bites-medical-road',
    name: 'Urban Bites Medical Road',
    cuisine: 'American comfort',
    deliveryTime: '16-25 min',
    rating: 4.7,
    distance: '0.8 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Nearby'],
    address: '22 Medical Road, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.8776205,
    longitude: 90.7174454,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-college-more',
    name: 'Napoli Noir College More',
    cuisine: 'Woodfired pizza',
    deliveryTime: '17-27 min',
    rating: 4.8,
    distance: '0.8 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Featured', 'Nearby'],
    address: '23 College More, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.881722,
    longitude: 90.7189126,
    featured: true,
    voucher: null,
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-puran-bazar',
    name: 'Nourish Garden Puran Bazar',
    cuisine: 'Healthy bowls',
    deliveryTime: '17-23 min',
    rating: 4.7,
    distance: '0.9 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Nearby'],
    address: '24 Puran Bazar, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8843798,
    longitude: 90.7223398,
    featured: false,
    voucher: null,
    menu: nourishMenu,
  },
  {
    id: 'spice-route-west-nagra',
    name: 'Spice Route West Nagra',
    cuisine: 'Comfort curry',
    deliveryTime: '17-24 min',
    rating: 4.6,
    distance: '1.0 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Voucher', 'Nearby'],
    address: '25 West Nagra, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.8850659,
    longitude: 90.7292017,
    featured: false,
    voucher: 'Buy 1 Get 1',
    menu: urbanBitesMenu,
  },
  {
    id: 'urban-bites-east-nagra',
    name: 'Urban Bites East Nagra',
    cuisine: 'American comfort',
    deliveryTime: '18-26 min',
    rating: 4.7,
    distance: '1.1 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Nearby'],
    address: '26 East Nagra, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.8819105,
    longitude: 90.7343307,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-shibbari',
    name: 'Napoli Noir Shibbari',
    cuisine: 'Woodfired pizza',
    deliveryTime: '18-27 min',
    rating: 4.8,
    distance: '1.2 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Nearby'],
    address: '27 Shibbari, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.8762664,
    longitude: 90.7367708,
    featured: false,
    voucher: null,
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-college-gate',
    name: 'Nourish Garden College Gate',
    cuisine: 'Healthy bowls',
    deliveryTime: '18-28 min',
    rating: 4.7,
    distance: '1.2 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Featured', 'Nearby'],
    address: '28 College Gate, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8703679,
    longitude: 90.7352729,
    featured: true,
    voucher: null,
    menu: nourishMenu,
  },
  {
    id: 'spice-route-charpara',
    name: 'Spice Route Charpara',
    cuisine: 'Comfort curry',
    deliveryTime: '18-24 min',
    rating: 4.6,
    distance: '1.3 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Nearby'],
    address: '29 Charpara, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.8658984,
    longitude: 90.7303294,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'urban-bites-bus-terminal',
    name: 'Urban Bites Bus Terminal',
    cuisine: 'American comfort',
    deliveryTime: '18-25 min',
    rating: 4.7,
    distance: '1.4 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Voucher', 'Nearby'],
    address: '30 Bus Terminal, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.8642799,
    longitude: 90.723192,
    featured: false,
    voucher: 'TK 70 OFF',
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-court-road',
    name: 'Napoli Noir Court Road',
    cuisine: 'Woodfired pizza',
    deliveryTime: '19-27 min',
    rating: 4.8,
    distance: '1.5 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Nearby'],
    address: '31 Court Road, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.8665241,
    longitude: 90.7158011,
    featured: false,
    voucher: null,
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-hospital-road',
    name: 'Nourish Garden Hospital Road',
    cuisine: 'Healthy bowls',
    deliveryTime: '19-28 min',
    rating: 4.6,
    distance: '1.5 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Nearby'],
    address: '32 Hospital Road, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8723909,
    longitude: 90.7107795,
    featured: false,
    voucher: null,
    menu: nourishMenu,
  },
  {
    id: 'spice-route-kalibari',
    name: 'Spice Route Kalibari',
    cuisine: 'Comfort curry',
    deliveryTime: '19-29 min',
    rating: 4.6,
    distance: '1.6 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Featured', 'Nearby'],
    address: '33 Kalibari, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.8801394,
    longitude: 90.7097213,
    featured: true,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'urban-bites-north-colony',
    name: 'Urban Bites North Colony',
    cuisine: 'American comfort',
    deliveryTime: '19-25 min',
    rating: 4.7,
    distance: '1.7 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Nearby'],
    address: '34 North Colony, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.887568,
    longitude: 90.713538,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-south-colony',
    name: 'Napoli Noir South Colony',
    cuisine: 'Woodfired pizza',
    deliveryTime: '20-27 min',
    rating: 4.8,
    distance: '1.8 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Voucher', 'Nearby'],
    address: '35 South Colony, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.8922079,
    longitude: 90.7214704,
    featured: false,
    voucher: 'Free dessert',
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-rail-crossing',
    name: 'Nourish Garden Rail Crossing',
    cuisine: 'Healthy bowls',
    deliveryTime: '20-28 min',
    rating: 4.6,
    distance: '1.8 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Nearby'],
    address: '36 Rail Crossing, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8907507,
    longitude: 90.7347485,
    featured: false,
    voucher: null,
    menu: nourishMenu,
  },
  {
    id: 'spice-route-teacher-quarter',
    name: 'Spice Route Teacher Quarter',
    cuisine: 'Comfort curry',
    deliveryTime: '20-29 min',
    rating: 4.6,
    distance: '1.9 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Nearby'],
    address: '37 Teacher Quarter, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.8831434,
    longitude: 90.7427209,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'urban-bites-municipal-road',
    name: 'Urban Bites Municipal Road',
    cuisine: 'American comfort',
    deliveryTime: '20-30 min',
    rating: 4.6,
    distance: '2.0 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Featured', 'Nearby'],
    address: '38 Municipal Road, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.8722193,
    longitude: 90.7445013,
    featured: true,
    voucher: null,
    thresholdOffer: {
      minOrderTk: 450,
      discountTk: 50,
    },
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-moddhonagar',
    name: 'Napoli Noir Moddhonagar',
    cuisine: 'Woodfired pizza',
    deliveryTime: '21-27 min',
    rating: 4.8,
    distance: '2.1 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Nearby'],
    address: '39 Moddhonagar, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.8623907,
    longitude: 90.73914,
    featured: false,
    voucher: null,
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-pagla-jora',
    name: 'Nourish Garden Pagla Jora',
    cuisine: 'Healthy bowls',
    deliveryTime: '21-28 min',
    rating: 4.6,
    distance: '2.2 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Nearby'],
    address: '40 Pagla Jora, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8569363,
    longitude: 90.7281255,
    featured: false,
    voucher: null,
    menu: nourishMenu,
  },
  {
    id: 'spice-route-shyamgonj-link',
    name: 'Spice Route Shyamgonj Link',
    cuisine: 'Comfort curry',
    deliveryTime: '21-29 min',
    rating: 4.5,
    distance: '2.3 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Voucher', 'Nearby'],
    address: '41 Shyamgonj Link, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.8584327,
    longitude: 90.7144948,
    featured: false,
    voucher: 'TK 50 OFF',
    menu: urbanBitesMenu,
  },
  {
    id: 'urban-bites-khal-par',
    name: 'Urban Bites Khal Par',
    cuisine: 'American comfort',
    deliveryTime: '22-31 min',
    rating: 4.6,
    distance: '2.4 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Nearby'],
    address: '42 Khal Par, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.8666188,
    longitude: 90.7044607,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-college-field',
    name: 'Napoli Noir College Field',
    cuisine: 'Woodfired pizza',
    deliveryTime: '22-32 min',
    rating: 4.8,
    distance: '2.4 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Nearby'],
    address: '43 College Field, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.8789454,
    longitude: 90.7010655,
    featured: false,
    voucher: null,
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-mymensingh-road',
    name: 'Nourish Garden Mymensingh Road',
    cuisine: 'Healthy bowls',
    deliveryTime: '22-28 min',
    rating: 4.6,
    distance: '2.5 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Nearby'],
    address: '44 Mymensingh Road, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8906698,
    longitude: 90.7054307,
    featured: false,
    voucher: null,
    menu: nourishMenu,
  },
  {
    id: 'spice-route-sadar-west',
    name: 'Spice Route Sadar West',
    cuisine: 'Comfort curry',
    deliveryTime: '22-29 min',
    rating: 4.5,
    distance: '2.6 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Featured', 'Nearby'],
    address: '45 Sadar West, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.8987344,
    longitude: 90.7162885,
    featured: true,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'urban-bites-sadar-east',
    name: 'Urban Bites Sadar East',
    cuisine: 'American comfort',
    deliveryTime: '23-31 min',
    rating: 4.6,
    distance: '2.7 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Nearby'],
    address: '46 Sadar East, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.8998617,
    longitude: 90.7333553,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-bridge-side',
    name: 'Napoli Noir Bridge Side',
    cuisine: 'Woodfired pizza',
    deliveryTime: '23-32 min',
    rating: 4.7,
    distance: '2.8 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Voucher', 'Nearby'],
    address: '47 Bridge Side, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.8909001,
    longitude: 90.7482431,
    featured: false,
    voucher: 'Flat TK 45 OFF',
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-old-court',
    name: 'Nourish Garden Old Court',
    cuisine: 'Healthy bowls',
    deliveryTime: '23-33 min',
    rating: 4.6,
    distance: '2.9 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Nearby'],
    address: '48 Old Court, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8738595,
    longitude: 90.7540457,
    featured: false,
    voucher: null,
    menu: nourishMenu,
  },
  {
    id: 'spice-route-borohatti',
    name: 'Spice Route Borohatti',
    cuisine: 'Comfort curry',
    deliveryTime: '25-31 min',
    rating: 4.5,
    distance: '3.3 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Out of range'],
    address: '49 Borohatti, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.8566691,
    longitude: 90.7493768,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  },
  {
    id: 'urban-bites-bausa',
    name: 'Urban Bites Bausa',
    cuisine: 'American comfort',
    deliveryTime: '26-33 min',
    rating: 4.5,
    distance: '3.8 km',
    accent: '#F6B89A',
    icon: 'fast-food',
    priceLevel: '$$',
    tags: ['Best seller', 'Combo deals', 'Voucher', 'Out of range'],
    address: '50 Bausa, Netrakona',
    heroTitle: 'Craveable bites after dark',
    heroSubtitle: 'Smash burgers, wraps, and signature loaded fries.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 79,
    latitude: 24.8439547,
    longitude: 90.7134663,
    featured: false,
    voucher: 'TK 80 OFF',
    menu: urbanBitesMenu,
  },
  {
    id: 'napoli-noir-singher-bangla',
    name: 'Napoli Noir Singher Bangla',
    cuisine: 'Woodfired pizza',
    deliveryTime: '27-35 min',
    rating: 4.7,
    distance: '4.1 km',
    accent: '#E7CAA7',
    icon: 'pizza',
    priceLevel: '$$$',
    tags: ['Pizza lovers', 'Chef\'s pick', 'Out of range'],
    address: '51 Singher Bangla, Netrakona',
    heroTitle: 'Woodfired classics with a dramatic twist',
    heroSubtitle: 'Charred crusts, lush toppings, and bold sauces.',
    coverImage: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 159,
    latitude: 24.8615573,
    longitude: 90.688006,
    featured: false,
    voucher: null,
    menu: napoliMenu,
  },
  {
    id: 'nourish-garden-nabinagar',
    name: 'Nourish Garden Nabinagar',
    cuisine: 'Healthy bowls',
    deliveryTime: '28-37 min',
    rating: 4.5,
    distance: '4.5 km',
    accent: '#CFE2B6',
    icon: 'leaf',
    priceLevel: '$$',
    tags: ['Healthy', 'Fresh', 'Featured', 'Out of range'],
    address: '52 Nabinagar, Netrakona',
    heroTitle: 'Fresh bowls for lighter days',
    heroSubtitle: 'Colorful grains, proteins, and bright dressings.',
    coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 119,
    latitude: 24.8982048,
    longitude: 90.6873061,
    featured: true,
    voucher: null,
    menu: nourishMenu,
  },
  {
    id: 'spice-route-mohanganj-link',
    name: 'Spice Route Mohanganj Link',
    cuisine: 'Comfort curry',
    deliveryTime: '30-40 min',
    rating: 4.4,
    distance: '4.9 km',
    accent: '#FFD7B7',
    icon: 'flame',
    priceLevel: '$$',
    tags: ['Local favorite', 'Family meal', 'Out of range'],
    address: '53 Mohanganj Link, Netrakona',
    heroTitle: 'Warm curries and cozy plates',
    heroSubtitle: 'Spice-forward comfort food with crowd-friendly portions.',
    coverImage: 'https://images.unsplash.com/photo-1604908176997-43153b8c76e9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 139,
    latitude: 24.9208451,
    longitude: 90.7217092,
    featured: false,
    voucher: null,
    menu: urbanBitesMenu,
  }
];
export const dummyRecommendedItems = [
  urbanBitesMenu[0],
  urbanBitesMenu[1],
  napoliMenu[0],
];
export const dummyHomePromos = homePromos;
export const dummyHomeQuickPicks = homeQuickPicks;
export const dummyDiscoverFilters = discoverFilters;

export const activeOrder: Order | null = null;

export const previousOrders: Order[] = [
  {
    id: "FD-2036",
    restaurantId: "napoli-noir-nagra",
    restaurantName: "Napoli Noir Nagra",
    status: "Delivered",
    eta: "Delivered in 22 min",
    total: 323,
    subtotalTk: 313,
    deliveryTk: 40,
    serviceFeeTk: 20,
    discountTk: 50,
    accent: "#E7CAA7",
    icon: "checkmark-done",
    items: ["Truffle Funghi", "Creamy Alfredo Pasta"],
    lineItems: [
      {
        id: "FD-2036-1",
        itemId: "np-1",
        name: "Truffle Funghi",
        quantity: 1,
        unitTk: 193,
        summary: '8" | Thick | Burrata',
      },
      {
        id: "FD-2036-2",
        itemId: "np-4",
        name: "Creamy Alfredo Pasta",
        quantity: 1,
        unitTk: 120,
      },
    ],
    paymentMethod: "COD",
    placedAt: "2026-03-27T20:10:00+06:00",
    deliveryAddress: "College Road, Netrakona",
    note: "Send cutlery.",
  },
  {
    id: "FD-2019",
    restaurantId: "nourish-garden-college-road",
    restaurantName: "Nourish Garden College Road",
    status: "Delivered",
    eta: "Delivered in 19 min",
    total: 233,
    subtotalTk: 173,
    deliveryTk: 40,
    serviceFeeTk: 20,
    discountTk: 0,
    accent: "#CFE2B6",
    icon: "checkmark-done",
    items: ["Green Goddess Bowl", "Berry Chia Jar"],
    lineItems: [
      {
        id: "FD-2019-1",
        itemId: "ng-1",
        name: "Green Goddess Bowl",
        quantity: 1,
        unitTk: 114,
      },
      {
        id: "FD-2019-2",
        itemId: "ng-3",
        name: "Berry Chia Jar",
        quantity: 1,
        unitTk: 59,
      },
    ],
    paymentMethod: "COD",
    placedAt: "2026-03-19T13:42:00+06:00",
    deliveryAddress: "Moktarpara, Netrakona",
  },
  {
    id: "FD-1987",
    restaurantId: "spice-route-new-market",
    restaurantName: "Spice Route New Market",
    status: "Delivered",
    eta: "Delivered in 27 min",
    total: 401,
    subtotalTk: 341,
    deliveryTk: 40,
    serviceFeeTk: 20,
    discountTk: 0,
    accent: "#FFD7B7",
    icon: "checkmark-done",
    items: ["Fire Chicken Roast", "Smash Burger Combo"],
    lineItems: [
      {
        id: "FD-1987-1",
        itemId: "ub-4",
        name: "Fire Chicken Roast",
        quantity: 2,
        unitTk: 108,
        summary: "Jali kebab",
      },
      {
        id: "FD-1987-2",
        itemId: "ub-1",
        name: "Smash Burger Combo",
        quantity: 1,
        unitTk: 125,
      },
    ],
    paymentMethod: "COD",
    placedAt: "2026-02-25T21:08:00+06:00",
    deliveryAddress: "New Market, Netrakona",
    note: "Extra tissue needed.",
  },
  {
    id: "FD-1972",
    restaurantId: "urban-bites-station-road",
    restaurantName: "Urban Bites Station Road",
    status: "Delivered",
    eta: "Delivered in 31 min",
    total: 554,
    subtotalTk: 494,
    deliveryTk: 40,
    serviceFeeTk: 20,
    discountTk: 0,
    accent: "#F6B89A",
    icon: "checkmark-done",
    items: ["Smash Burger Combo", "Loaded Fries", "Fire Chicken Roast"],
    lineItems: [
      {
        id: "FD-1972-1",
        itemId: "ub-1",
        name: "Smash Burger Combo",
        quantity: 2,
        unitTk: 125,
      },
      {
        id: "FD-1972-2",
        itemId: "ub-3",
        name: "Loaded Fries",
        quantity: 2,
        unitTk: 68,
      },
      {
        id: "FD-1972-3",
        itemId: "ub-4",
        name: "Fire Chicken Roast",
        quantity: 1,
        unitTk: 108,
        summary: "Chutney",
      },
    ],
    paymentMethod: "COD",
    placedAt: "2026-03-05T19:24:00+06:00",
    deliveryAddress: "Station Road, Netrakona",
  },
];

export const dummyOrders: Order[] = activeOrder
  ? [activeOrder, ...previousOrders]
  : [...previousOrders];

export const cartItems = [
  {
    id: "cart-1",
    restaurant: "Urban Bites",
    item: "Smash Burger Combo",
    qty: 1,
    price: 12.5,
    accent: "#F6B89A",
    icon: "fast-food",
  },
  {
    id: "cart-2",
    restaurant: "Urban Bites",
    item: "Loaded Fries",
    qty: 2,
    price: 6.75,
    accent: "#F0E0A4",
    icon: "nutrition",
  },
];

export const userProfile = {
  name: "Ava Rahman",
  email: "ava.rahman@example.com",
  location: "Banani, Dhaka",
  loyaltyPoints: 1280,
};

export const orderBreakdown = {
  subtotal: 26.0,
  delivery: 2.5,
  serviceFee: 1.25,
  discount: 0,
  total: 29.75,
};

export const profileOptions = [
  { id: "1", label: "Saved addresses", icon: "location-outline" },
  { id: "2", label: "Payment methods", icon: "card-outline" },
  { id: "3", label: "Notifications", icon: "notifications-outline" },
  { id: "4", label: "Guide buddy", icon: "sparkles-outline" },
  { id: "5", label: "Help center", icon: "help-circle-outline" },
  { id: "6", label: "Privacy policy", icon: "shield-checkmark-outline" },
];
