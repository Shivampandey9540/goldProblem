const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  entityUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserEntity",
  },
  quantity: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["CREDIT", "DEBIT"],
    required: true,
  },
  status: {
    type: String,
    enum: ["FAILED", "SUCCESS", "WAITING", "CANCELED", "PENDING"],
    required: true,
  },
  runningBalance: {
    wallet: {
      type: Number,
      required: true,
    },
    loyaltyPoints: {
      type: Number,
      required: true,
    },
    gold: {
      type: Number,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
