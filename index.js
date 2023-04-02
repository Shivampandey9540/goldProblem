const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/index");
const GoldTransaction = require("./models/GoldTransaction");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const router = require("./routes/index");
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

app.use("/", router);

app.listen(8000, () => {
  console.log("I am runing");
});
