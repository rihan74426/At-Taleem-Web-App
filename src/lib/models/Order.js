// lib/models/Order.js
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    userId: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    deliveryPhone: { type: String, required: true },
    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    sessionKey: { type: String },
    gatewayPageURL: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
