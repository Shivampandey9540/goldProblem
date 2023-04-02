const mongoose = require("mongoose");

const userEntitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  entityName: { type: String, required: true, default: "My Wallet" },
  entityType: { type: String, required: true, default: "personal wallet" },
  entityDescription: { type: String, default: "I am buying through my Wallet" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserEntity", userEntitySchema);
