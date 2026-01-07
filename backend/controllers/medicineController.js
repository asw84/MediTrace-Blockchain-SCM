const Medicine = require("../models/Medicine");
const Transaction = require("../models/Transaction");
const { web3js, contract } = require("../config/web3");
require("dotenv").config();

const ownerAddress = process.env.OWNER_ADDRESS;
// Ensure private key has 0x prefix
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY?.startsWith('0x')
  ? process.env.OWNER_PRIVATE_KEY
  : '0x' + process.env.OWNER_PRIVATE_KEY;

exports.addMedicine = async (req, res) => {
  try {
    const { name, description, stage } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!ownerAddress || !ownerPrivateKey) {
      throw new Error("OWNER_ADDRESS or OWNER_PRIVATE_KEY not configured");
    }

    const nonce = await web3js.eth.getTransactionCount(ownerAddress);
    const gasPrice = await web3js.eth.getGasPrice();

    const data = contract.methods.addMedicine(name, description).encodeABI();

    const tx = {
      from: ownerAddress,
      to: contract.options.address,
      gas: 2000000,
      gasPrice: gasPrice,
      nonce: nonce,
      data: data,
    };

    const signedTx = await web3js.eth.accounts.signTransaction(tx, ownerPrivateKey);
    const receipt = await web3js.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Medicine created on blockchain. Hash:', receipt.transactionHash);

    const medicineCounter = await contract.methods.medicineCounter().call();

    const medicine = new Medicine({
      blockchainId: parseInt(medicineCounter),
      name,
      description,
      stage: "Ordered",
    });

    try {
      await medicine.save();
    } catch (dbError) {
      console.log('MongoDB save skipped or failed');
    }

    const transaction = new Transaction({
      medicineId: medicine.blockchainId,
      participant: ownerAddress,
      action: "MEDICINE_CREATED",
      transactionHash: receipt.transactionHash,
      timestamp: Date.now()
    });

    try {
      await transaction.save();
    } catch (dbError) {
      console.log('Transaction record save skipped or failed');
    }

    res.status(201).json({
      message: "Medicine added successfully",
      medicine,
      transactionHash: receipt.transactionHash
    });

  } catch (error) {
    console.error("Error adding medicine:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    res.json(medicines);
  } catch (error) {
    console.log("MongoDB error, returning empty medicine list");
    res.json([]);
  }
};

exports.getMedicineHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ medicineId: req.params.id }).sort({ timestamp: -1 });
    res.json(transactions);
  } catch (error) {
    console.log("MongoDB error, returning empty history");
    res.json([]);
  }
};

exports.getMedicineStage = async (req, res) => {
  try {
    const medicineId = req.params.id;
    const medicineIdNum = parseInt(medicineId);

    if (isNaN(medicineIdNum)) {
      return res.status(400).json({ error: "Invalid Medicine ID" });
    }

    const stage = await contract.methods.getMedicineStage(medicineIdNum).call();
    res.json({ medicineId: medicineIdNum, stage });
  } catch (error) {
    console.error("Blockchain error getting stage:", error.message);
    res.status(500).json({ error: "Could not fetch stage from blockchain" });
  }
};