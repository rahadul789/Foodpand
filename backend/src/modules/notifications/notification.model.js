const { Schema, model } = require("mongoose");

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["orders", "offers", "payments", "account", "support"],
      default: "orders",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    unread: {
      type: Boolean,
      default: true,
      index: true,
    },
    target: {
      type: String,
      default: "notifications",
      trim: true,
    },
    targetOrderId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Order",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = model("Notification", notificationSchema);

module.exports = {
  Notification,
};
