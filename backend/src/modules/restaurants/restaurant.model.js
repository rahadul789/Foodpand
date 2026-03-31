const { Schema, model } = require("mongoose");

const genericOfferSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "voucher",
        "threshold_discount",
        "free_delivery",
        "flat_discount",
        "percentage_discount",
        "item_discount",
        "category_discount",
        "buy_x_get_y",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    shortLabel: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
    },
    minOrderTk: {
      type: Number,
      default: 0,
    },
    discountTk: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    maxDiscountTk: {
      type: Number,
      default: 0,
    },
    freeDelivery: {
      type: Boolean,
      default: false,
    },
    isAutoApply: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stackable: {
      type: Boolean,
      default: false,
    },
    applicableMenuItemKeys: {
      type: [String],
      default: [],
    },
    applicableCategoryKeys: {
      type: [String],
      default: [],
    },
    buyQuantity: {
      type: Number,
      default: 0,
    },
    getQuantity: {
      type: Number,
      default: 0,
    },
    rewardItemKey: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const menuItemOptionChoiceSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    priceModifier: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  },
);

const menuItemOptionGroupSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    minSelect: {
      type: Number,
      default: 0,
    },
    maxSelect: {
      type: Number,
      default: 1,
    },
    choices: {
      type: [menuItemOptionChoiceSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const menuItemAddonSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    priceModifier: {
      type: Number,
      default: 0,
    },
    popular: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const menuItemAddonGroupSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    maxSelect: {
      type: Number,
      default: 1,
    },
    optionalLabel: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    items: {
      type: [menuItemAddonSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const menuItemBundleSuggestionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    priceModifier: {
      type: Number,
      default: 0,
    },
    accent: {
      type: String,
      default: "#FFC857",
    },
    icon: {
      type: String,
      default: "sparkles-outline",
    },
  },
  {
    _id: false,
  },
);

const menuItemDetailSchema = new Schema(
  {
    image: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    addonGroups: {
      type: [menuItemAddonGroupSchema],
      default: [],
    },
    bundleSuggestions: {
      type: [menuItemBundleSuggestionSchema],
      default: [],
    },
    instructionsPlaceholder: {
      type: String,
      default: "",
    },
    maxInstructionsLength: {
      type: Number,
      default: 500,
    },
  },
  {
    _id: false,
  },
);

const menuCategorySchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  },
);

const menuItemSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    accent: {
      type: String,
      default: "#FFC857",
    },
    icon: {
      type: String,
      default: "restaurant-outline",
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    optionGroups: {
      type: [menuItemOptionGroupSchema],
      default: [],
    },
    detail: {
      type: menuItemDetailSchema,
      default: null,
    },
    popular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  },
);

const restaurantSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: {
        unique: true,
        sparse: true,
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    cuisine: {
      type: String,
      default: "",
      trim: true,
    },
    cuisineTags: {
      type: [String],
      default: [],
    },
    deliveryTime: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryMinMinutes: {
      type: Number,
      default: 0,
    },
    deliveryMaxMinutes: {
      type: Number,
      default: 0,
    },
    defaultPrepMinMinutes: {
      type: Number,
      default: 15,
    },
    defaultPrepMaxMinutes: {
      type: Number,
      default: 20,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    accent: {
      type: String,
      default: "#FFC857",
    },
    icon: {
      type: String,
      default: "restaurant-outline",
    },
    priceLevel: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    heroTitle: {
      type: String,
      default: "",
      trim: true,
    },
    heroSubtitle: {
      type: String,
      default: "",
      trim: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    logoImage: {
      type: String,
      default: "",
    },
    startingPrice: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    supportsScheduledDelivery: {
      type: Boolean,
      default: false,
    },
    offers: {
      type: [genericOfferSchema],
      default: [],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    menuCategories: {
      type: [menuCategorySchema],
      default: [],
    },
    menuItems: {
      type: [menuItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

restaurantSchema.index({ location: "2dsphere" });

const Restaurant = model("Restaurant", restaurantSchema);

module.exports = {
  Restaurant,
};
