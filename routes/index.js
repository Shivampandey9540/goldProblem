const express = require("express");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/index");
const GoldTransaction = require("../models/GoldTransaction");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const WalletTransaction = require("../models/WalletTransaction");
const Tansaction = require("../models/Transection");
const Entity = require("../models/Entity");
require("dotenv").config();

const router = express.Router();

// User Signup
router.post(
  "/signup",
  [
    check("firstName", "First name is required").not().isEmpty(),
    check("lastName", "Last name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      mobileNumber,
      country,
      runningBalance,
    } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      user = new User({
        firstName,
        lastName,
        email,
        mobileNumber,
        country,
        password,
        runningBalance,
      });
      const entity = new Entity({
        userId: user.id,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      res.status(200).json({
        userInfo: user,
        wallet: entity,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// user Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user with provided email exists
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Compare provided password with stored hashed password

    const match = user.comparePassword(password);

    if (!match) {
      return res.status(401).json({ message: "Authentication failed , Here" });
    }
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "test",
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Creating a Gold Transection here
router.post("/GoldTran", async (req, res) => {
  console.log("heelo");
  try {
    const {
      userId,
      entityUser,
      quantity,
      amount,
      type,
      status,
      runningBalance,
    } = req.body;
    if (
      !userId ||
      !entityUser ||
      !quantity ||
      !amount ||
      !type ||
      !status ||
      !runningBalance
    ) {
      return res.status(404).json({
        sucesss: false,
        Message: "All information should be Avilable",
      });
    }
    let usercheck = await User.find({ _id: userId });
    let entitycheck = await User.find({ _id: entityUser });
    if (!usercheck || !entitycheck) {
      return res.status(403).json({
        sucesss: false,
        message: "User not found",
      });
    }

    NewGoldTran = new GoldTransaction({
      userId: userId,
      entityUser: entityUser,
      quantity: quantity,
      amount: amount,
      type: type,
      status: status,
      runningBalance: runningBalance,
    });
    await NewGoldTran.save();
    res.status(200).json({
      sucess: true,
      message: "Gold Trancsection has been done",
      NewGoldTran: NewGoldTran,
    });
  } catch (error) {
    res.status(400).json({
      sucesss: false,
      message: "Error in data please Check the console",
      Error: error,
    });
    console.log(error);
  }
});

//Creating Wallet Transection here
const wallet = async (req, res) => {
  try {
    console.log(req.body);
    const { userId, amount, type, status, runningBalance, _id } =
      req.body.Trans;
    req.body;
    if (!userId || !amount || !type || !status || !_id) {
      return res.status(404).json({
        sucesss: false,
        Message: "All information should be Avilable",
      });
    }
    const usercheck = await User.find({ _id: userId });
    if (!usercheck) {
      return res.status(403).json({
        sucesss: false,
        message: "User not found",
      });
    }

    const NewWalTran = new WalletTransaction({
      userId: userId,
      amount: amount,
      type: type,
      status: status,
      runningBalance: req.body.Trans.runningBalance.wallet,
      Transection: _id,
    });
    await NewWalTran.save();
    res.status(200).json({
      sucess: true,
      data: NewWalTran,
    });
  } catch (error) {
    throw error;
    console.log(error);
  }
};

//Creating Transection here
router.post("/transection", async (req, res) => {
  try {
    const { userId, quantity, amount, type, status, loyaltyPoints } = req.body;

    const user = await User.find({ _id: userId });
    const gold = await GoldTransaction.find({ userId: userId });
    console.log(user[0].runningBalance);
    let newAmount = 0;
    if (type == "CREDIT") {
      newAmount = user[0].runningBalance.wallet + amount;
    } else {
      newAmount = user[0].runningBalance.wallet - amount;
    }

    user[0].runningBalance.wallet = newAmount;
    const data = new Tansaction({
      userId: userId,
      quantity: quantity,
      amount: amount,
      type: type,
      status: status,
      runningBalance: {
        wallet: newAmount,
        gold: user[0].runningBalance.gold,
        loyaltyPoints: loyaltyPoints,
      },
    });
    req.body.Trans = data;
    wallet(req, res);
    await data.save();
    await user[0].save();
    // res.status(200).json({
    //   sucesss: true,
    //   data: data,
    // });
  } catch (error) {
    res.status(400).json({
      sucesss: false,
      message: "some Error has been occured doing this transection",
    });
    console.log(error);
  }
});

// Calculate user portfolio
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
