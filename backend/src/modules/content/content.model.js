const { Schema, model } = require("mongoose");

const categorySchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    accent: {
      type: String,
      default: "#FFD9C8",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const quickPickSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#FFF1C9",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const promoSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    bg: {
      type: String,
      default: "#FF7A59",
    },
    glow: {
      type: String,
      default: "#FFD66B",
    },
    eyebrow: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    code: {
      type: String,
      default: "",
    },
    minOrderTk: {
      type: Number,
      default: 0,
    },
    validFor: {
      type: String,
      default: "",
    },
    perks: {
      type: [String],
      default: [],
    },
    terms: {
      type: [String],
      default: [],
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const discoverFilterSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#F4F0EB",
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Category = model("Category", categorySchema);
const QuickPick = model("QuickPick", quickPickSchema);
const Promo = model("Promo", promoSchema);
const DiscoverFilter = model("DiscoverFilter", discoverFilterSchema);

module.exports = {
  Category,
  QuickPick,
  Promo,
  DiscoverFilter,
};
