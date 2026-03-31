const { Schema, model } = require("mongoose");

const favoriteSchema = new Schema(
  {
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
  },
  {
    timestamps: true,
  },
);

favoriteSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });

const Favorite = model("Favorite", favoriteSchema);

module.exports = {
  Favorite,
};
