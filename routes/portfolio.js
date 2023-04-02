const express = require("express");
const router = express.Router();
const auth = require("../middleware/index");
const User = require("../models/user.js");
const GoldTransaction = require("../models/GoldTransaction");
const WalletTransaction = require("../models/WalletTransaction");

// Calculate user portfolio
router.get("/portfolio/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch wallet transaction records for the user
    const walletTransactions = await WalletTransaction.find({ userId });

    // Calculate net funds added to the user's wallet
    const netFundAdded = walletTransactions.reduce((acc, cur) => {
      if (cur.type === "CREDIT") {
        return acc + cur.amount;
      } else {
        return acc - cur.amount;
      }
    }, 0);

    // Fetch user details
    const user = await User.findById(userId);

    // Calculate current fund
    const currentFund = user.runningBalance.wallet + netFundAdded;

    // Fetch gold transaction records for the user
    const goldTransactions = await GoldTransaction.find({ userId });

    // Calculate net gold quantity added to or sold from the user's account
    const netGoldQuantity = goldTransactions.reduce((acc, cur) => {
      if (cur.type === "CREDIT") {
        return acc + cur.quantity;
      } else {
        return acc - cur.quantity;
      }
    }, 0);

    // Calculate current value of gold in the user's account
    const currentValue =
      user.runningBalance.goldPrice * user.runningBalance.gold;

    // Calculate net growth or loss
    const netGrowthOrLoss = currentValue - currentFund;

    // Calculate gain or loss percentage
    const gainOrLossPercentage = (
      (netGrowthOrLoss / currentFund) *
      100
    ).toFixed(2);

    // Return the response
    res.json({
      netFundAdded,
      currentFund,
      netGrowthOrLoss,
      gainOrLossPercentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
