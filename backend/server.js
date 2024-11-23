const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

//schema
const Transaction = require("./model/transactionModel");

const app = express();

//middleware

app.use(express.json());
app.use(cors({ origin: "*" }));

//connection mongodb
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
  });
  

// Welcome Route
app.get("/", (req, res) => {
  res.send("Welcome to the API! hello");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


app.post("/api/transactions", async (req, res) => {
  try {
    const { amount, transaction_type, user } = req.body;

    if (!amount || !transaction_type || !user) {
      return res
        .status(400)
        .json({ error: "amount, transaction_type, user fields are required." });
    }

    const lastTransaction = await Transaction.findOne().sort({
      transaction_id: -1,
    });

    console.log("Last Transaction:", lastTransaction);

    const transaction_id =
      lastTransaction && typeof lastTransaction.transaction_id === "number"
        ? lastTransaction.transaction_id + 1
        : 1;

    if (isNaN(transaction_id)) {
      throw new Error("Invalid transaction_id: Must be a valid number.");
    }

    const newTransaction = new Transaction({
      transaction_id,
      amount,
      transaction_type,
      user,
    });

    await newTransaction.save();

    res.status(201).json({
      transaction_id: newTransaction.transaction_id,
      amount: newTransaction.amount,
      transaction_type: newTransaction.transaction_type,
      status: newTransaction.status,
      user: newTransaction.user,
      timestamp: newTransaction.timestamp,
    });
  } catch (error) {
    console.error("Error creating transaction:", error.message);
    res.status(500).json({ error: error.message });
  }
});


//user_id query params route

app.get("/api/transactions", async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res
        .status(400)
        .json({ error: "user_id is required as a query parameter." });
    }

    const transactions = await Transaction.find({ user: user_id });

    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//put route it will change the status based on transactionID

app.put("/api/transactions/:transaction_id", async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const { status } = req.body;

    if (isNaN(transaction_id) || transaction_id === null || transaction_id === undefined) {
      throw new Error("Invalid transaction_id: Must be a valid number.");
    }

    if (!status || !["COMPLETED", "FAILED"].includes(status)) {
      return res
        .status(400)
        .json({
          error: "Invalid status value. Must be 'COMPLETED' or 'FAILED'.",
        });
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { transaction_id: parseInt(transaction_id) },
      { status },
      { new: true }
    );

    if (!updatedTransaction) {
      console.log("Transaction not found for transaction_id:", transaction_id);
      return res.status(404).json({ error: "Transaction not found." });
    }

    res.status(200).json({
      transaction_id: updatedTransaction._id,
      amount: updatedTransaction.amount,
      transaction_type: updatedTransaction.transaction_type,
      status: updatedTransaction.status,
      timestamp: updatedTransaction.timestamp,
    });
  } catch (error) {
    console.error("Error updating transaction:", error.message);
    res.status(500).json({ error: error.message });
  }
});


//get route based on transaction

app.get("/api/transactions/:transaction_id", async (req, res) => {
  try {
    const { transaction_id } = req.params;

    const transaction = await Transaction.findOne({
      transaction_id: parseInt(transaction_id),
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    res.status(200).json({
      transaction_id: transaction._id,
      amount: transaction.amount,
      transaction_type: transaction.transaction_type,
      status: transaction.status,
      timestamp: transaction.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
