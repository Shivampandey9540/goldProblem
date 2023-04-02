const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/index");
const GoldTransaction = require("./models/GoldTransaction");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const router = require("./routes/portfolio");
const User = require("./models/user");
const WalletTransaction = require("./models/WalletTransaction");
const Tansaction = require("./models/Transection");
const Entity = require("./models/Entity");
require("dotenv").config();

const app = express();

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost/goldFintechApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Middleware
app.use(bodyParser.json());

app.post("/Gold", async (req, res) => {
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
    const usercheck = await User.find({ _id: userId });
    const entitycheck = await User.find({ _id: entityUser });
    if (!usercheck || !entitycheck) {
      return res.status(403).json({
        sucesss: false,
        message: "User not found",
      });
    }

    const NewGoldTran = new GoldTransaction({
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
app.post("/wallet", async (req, res) => {
  try {
    const { userId, amount, type, status, runningBalance, Transection } =
      req.body;
    req.body;
    if (!userId || !amount || !type || !status || !runningBalance) {
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

    const NewWalTran = await WalletTransaction({
      userId: userId,
      amount: amount,
      type: type,
      status: status,
      runningBalance: runningBalance,
      Transection: Transection,
    });
    await NewWalTran.save();
    res.status(200).json({
      sucess: true,
      data: NewWalTran,
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

app.post("/tran", async (req, res) => {
  try {
    const { userId, quantity, amount, type, status, runningBalance } = req.body;
    const data = await Tansaction({
      userId: userId,
      quantity: quantity,
      amount: amount,
      type: type,
      status: status,
      runningBalance: runningBalance,
    });
    res.status(200).json({
      sucesss: true,
      data: data,
    });
  } catch (error) {
    res.status(400).json({
      sucesss: false,
      message: "some Error has been occured doing this transection",
    });
    console.log(error);
  }
});
//signup
app.post(
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

// Routes
app.post("/login", async (req, res) => {
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

app.use("/port", router);
app.listen(8000, () => {
  console.log("I am runing");
});
