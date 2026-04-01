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
    liveDeliveryLocation: {
      type: riderLiveLocationSchema,
      default: null,
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
