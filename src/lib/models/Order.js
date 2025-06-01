// lib/models/Order.js
import mongoose from "mongoose";

const BookItemSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
    index: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const TrackingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "failed"],
    default: "pending",
  },
  location: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  notes: String,
});

const OrderSchema = new mongoose.Schema(
  {
    items: {
      type: [BookItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    buyerName: {
      type: String,
      required: true,
      trim: true,
    },
    buyerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "delivery",
        "failed",
        "cancelled",
        "completed",
      ],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded", "Failed"],
      default: "Unpaid",
      index: true,
    },
    paymentDetails: {
      transactionId: String,
      validationId: String,
      amount: Number,
      paidAt: Date,
    },
    tracking: {
      type: [TrackingSchema],
      default: [],
    },
    sessionKey: String,
    gatewayPageURL: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for frequently queried fields
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

// Virtual for order age
OrderSchema.virtual("orderAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for total items
OrderSchema.virtual("totalItems").get(function () {
  return this.items.reduce((sum, item) => sum + item.qty, 0);
});

// Pre-save middleware for validation
OrderSchema.pre("save", function (next) {
  // Validate phone number format
  const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
  if (!phoneRegex.test(this.deliveryPhone)) {
    next(new Error("Invalid phone number format"));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.buyerEmail)) {
    next(new Error("Invalid email format"));
  }

  // Calculate total amount if not provided
  if (!this.amount) {
    this.amount = this.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
  }

  next();
});

// Static method for bulk operations
OrderSchema.statics.bulkUpdateStatus = async function (orderIds, status) {
  return this.updateMany({ _id: { $in: orderIds } }, { $set: { status } });
};

// Instance method for tracking updates
OrderSchema.methods.addTrackingUpdate = async function (
  status,
  location,
  notes
) {
  this.tracking.push({
    status,
    location,
    notes,
    timestamp: new Date(),
  });
  this.status = status;
  return this.save();
};

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
