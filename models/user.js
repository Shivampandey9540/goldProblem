const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  password: { type: String, required: false },
  mobileNumber: { type: String, required: true },
  country: { type: String, required: true },
  email: { type: String, required: true },
  runningBalance: {
    wallet: { type: Number, required: true },
    gold: { type: Number, required: true },
    goldPrice: { type: Number, required: true },
  },
});

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      this.password = await bcryptjs.hash(this.password, 10);
    }
    next();
  } catch (error) {
    console.log(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = bcryptjs.compare(candidatePassword, this.password);
  return isMatch;
};

const User = mongoose.model("User", userSchema);
// const User = mongoose.model("User", userSchema);
module.exports = User;
