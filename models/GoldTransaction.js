const mongoose = require("mongoose");
const goldTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  entityUser: { type: mongoose.Schema.Types.ObjectId, ref: "UserEntity" },
  quantity: { type: Number, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true, enum: ["CREDIT", "DEBIT"] },
  status: {
    type: String,
    required: true,
    enum: ["FAILED", "SUCCESS", "WAITING", "CANCELED", "PENDING"],
  },
  runningBalance: {
    wallet: { type: Number, required: true },
    gold: { type: Number, required: true },
    goldPrice: { type: Number, required: true },
  },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const GoldTransaction = mongoose.model(
  "GoldTransaction",
  goldTransactionSchema
);

module.exports = GoldTransaction;
