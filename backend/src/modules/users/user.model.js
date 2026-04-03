const { Schema, model } = require("mongoose");

const pointSchema = new Schema(
  {
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
  {
    _id: false,
  },
);

const userLocationSchema = new Schema(
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
    location: {
      type: pointSchema,
      default: () => ({
        type: "Point",
        coordinates: [0, 0],
      }),
    },
    savedAddressId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Address",
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const riderLiveLocationSchema = new Schema(
  {
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
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
      default: null,
    },
  },
  {
    _id: false,
  },
);

const deliveryAvailabilitySchema = new Schema(
  {
    isOnline: {
      type: Boolean,
      default: false,
    },
    acceptsNewOrders: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const pushTokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["android", "ios"],
      default: "android",
    },
    appId: {
      type: String,
      default: "customer-app",
      trim: true,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "restaurant_owner", "delivery_partner", "admin"],
      default: "customer",
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    currentDeviceLocation: {
      type: userLocationSchema,
      default: null,
    },
    selectedDeliveryLocation: {
      type: userLocationSchema,
      default: null,
    },
    deliveryTransportMode: {
      type: String,
      enum: ["bicycle", "motorbike", "car"],
      default: "bicycle",
    },
    deliveryAvailability: {
      type: deliveryAvailabilitySchema,
      default: () => ({
        isOnline: false,
        acceptsNewOrders: true,
        lastSeenAt: null,
      }),
    },
    liveDeliveryLocation: {
      type: riderLiveLocationSchema,
      default: null,
    },
    pushTokens: {
      type: [pushTokenSchema],
      default: [],
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

const User = model("User", userSchema);

module.exports = {
  User,
};
