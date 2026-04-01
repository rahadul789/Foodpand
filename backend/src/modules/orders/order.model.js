const { Schema, model } = require("mongoose");

const orderLineItemSchema = new Schema(
  {
    itemId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitTk: {
      type: Number,
      required: true,
      min: 0,
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  },
);

const orderStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "Pending acceptance",
        "Preparing",
        "Ready for pickup",
        "On the way",
        "Delivered",
        "Cancelled",
      ],
      required: true,
    },
    actorRole: {
      type: String,
      enum: ["customer", "restaurant_owner", "delivery_partner", "admin"],
      required: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const appliedOfferSchema = new Schema(
  {
    type: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    shortLabel: {
      type: String,
      default: "",
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
    },
    discountTk: {
      type: Number,
      default: 0,
    },
    freeDeliveryApplied: {
      type: Boolean,
      default: false,
    },
    isAutoApply: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const orderLiveLocationSchema = new Schema(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    heading: {
      type: Number,
      default: null,
    },
    speed: {
      type: Number,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const orderDeliveryLocationSchema = new Schema(
  {
    label: {
      type: String,
      default: "",
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    restaurantOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },
    restaurantAccent: {
      type: String,
      default: "#FFC857",
    },
    restaurantIcon: {
      type: String,
      default: "restaurant-outline",
      trim: true,
    },
    restaurantCoverImage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "Pending acceptance",
        "Preparing",
        "Ready for pickup",
        "On the way",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending acceptance",
      index: true,
    },
    eta: {
      type: String,
      default: "Waiting for restaurant",
      trim: true,
    },
    subtotalTk: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryTk: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceFeeTk: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTk: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      default: "",
      trim: true,
    },
    appliedOffer: {
      type: appliedOfferSchema,
      default: null,
    },
    totalTk: {
      type: Number,
      required: true,
      min: 0,
    },
    items: {
      type: [String],
      default: [],
    },
    lineItems: {
      type: [orderLineItemSchema],
      default: [],
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "bKash"],
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryLocation: {
      type: orderDeliveryLocationSchema,
      default: null,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    canTrack: {
      type: Boolean,
      default: false,
    },
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    riderName: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryTransportMode: {
      type: String,
      enum: ["bicycle", "motorbike", "car"],
      default: "bicycle",
    },
    deliveryLiveLocation: {
      type: orderLiveLocationSchema,
      default: null,
    },
    prepareMinMinutes: {
      type: Number,
      default: null,
    },
    prepareMaxMinutes: {
      type: Number,
      default: null,
    },
    estimatedReadyAt: {
      type: Date,
      default: null,
    },
    restaurantAcceptedAt: {
      type: Date,
      default: null,
    },
    readyForPickupAt: {
      type: Date,
      default: null,
    },
    deliveryAcceptedAt: {
      type: Date,
      default: null,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [orderStatusHistorySchema],
      default: [],
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.pre("validate", function ensureOrderCode(next) {
  if (!this.orderCode) {
    this.orderCode = `FD-${String(this._id).slice(-8).toUpperCase()}`;
  }

  next();
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ userId: 1, status: 1, createdAt: -1 });

const Order = model("Order", orderSchema);

module.exports = {
  Order,
};
