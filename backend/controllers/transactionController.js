const Transaction = require("../models/Transaction");
const Medicine = require("../models/Medicine");
const { web3js, contract } = require("../config/web3");
require("dotenv").config();

const ownerAddress = process.env.OWNER_ADDRESS;
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY?.startsWith('0x')
  ? process.env.OWNER_PRIVATE_KEY
  : '0x' + process.env.OWNER_PRIVATE_KEY;

exports.recordTransaction = async (req, res) => {
  try {
    const { medicineId, action } = req.body;

    if (!medicineId || !action) {
      return res.status(400).json({ error: "Medicine ID and Action are required" });
    }

    console.log(`Processing transaction: ${action} for medicine ${medicineId}`);

    const nonce = await web3js.eth.getTransactionCount(ownerAddress);
    const gasPrice = await web3js.eth.getGasPrice();

    let method;
    // Map the dropdown values from the frontend to contract methods
    const normalizedAction = action.toLowerCase().trim();

    if (normalizedAction === "shipped") {
      method = contract.methods.distributeMedicine(medicineId);
    } else if (normalizedAction === "in transit" || normalizedAction === "in_transit") {
      method = contract.methods.manufactureMedicine(medicineId);
    } else if (normalizedAction === "received") {
      method = contract.methods.supplyRawMaterials(medicineId);
    } else {
      console.error(`Invalid action: ${action}`);
      return res.status(400).json({ error: "Invalid action selected" });
    }

    const tx = {
      from: ownerAddress,
      to: contract.options.address,
      gas: 500000,
      gasPrice,
      nonce,
      data: method.encodeABI(),
    };

    const signedTx = await web3js.eth.accounts.signTransaction(tx, ownerPrivateKey);
    const receipt = await web3js.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`Successfully recorded ${action} in blockchain! Hash: ${receipt.transactionHash}`);

    // Save to local DB records
    const transaction = new Transaction({
      medicineId,
      participant: ownerAddress,
      action: action.toUpperCase(),
      transactionHash: receipt.transactionHash,
      timestamp: Date.now()
    });
    await transaction.save();

    res.status(201).json({
      message: "Transaction recorded in blockchain",
      transactionHash: receipt.transactionHash,
      action: action
    });

  } catch (error) {
    console.error("Blockchain transaction error:", error.message);
    // If it's a revert, try to extract the reason
    const reason = error.reason || error.message;
    res.status(500).json({ error: "Blockchain transaction failed", details: reason });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ timestamp: -1 });
    res.json(transactions);
  } catch (error) {
    res.json([]);
  }
};