const express = require("express");
const router = express.Router();
const auth = require("../middleware/index");
const User = require("../models/user.js");
const GoldTransaction = require("../models/GoldTransaction");
const WalletTransaction = require("../models/WalletTransaction");

// Calculate user portfolio

// User data Callculation
router.get("/portfolio", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Calculate net fund added
    const creditTransactions = await WalletTransaction.find({
      userId,
      type: "CREDIT",
      status: "SUCCESS",
    });
    const netFundAdded = creditTransactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

    // Calculate current fund
    const user = await User.findById(userId);
    const currentFund = user.runningBalance.wallet;

    // Calculate net growth or loss
    const goldTransactions = await GoldTransaction.find({
      userId,
      status: "SUCCESS",
    });
    const goldQuantity = goldTransactions.reduce((total, transaction) => {
      if (transaction.type === "CREDIT") {
        return total + transaction.quantity;
      } else {
        return total - transaction.quantity;
      }
    }, 0);
    const currentGoldValue = user.runningBalance.goldPrice;
    const netGrowthOrLoss =
      goldQuantity * currentGoldValue + currentFund - netFundAdded;

    // Calculate gain or loss percentage
    const initialInvestment = netFundAdded + goldQuantity * currentGoldValue;
    const gainOrLossPercentage =
      ((netGrowthOrLoss - initialInvestment) / initialInvestment) * 100;

    res.json({
      netFundAdded,
      currentFund,
      netGrowthOrLoss,
      gainOrLossPercentage,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
