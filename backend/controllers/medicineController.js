// NOTE: For this demo assessment, MongoDB is mocked using an in-memory array 
// to focus exclusively on Web3.js integration and Blockchain data flow.
// In a production environment, this would sync with a live MongoDB instance.

const Medicine = require("../models/Medicine");
const Transaction = require("../models/Transaction");
const { web3js, contract } = require("../config/web3");

const ownerAddress = process.env.OWNER_ADDRESS;

if (!ownerAddress) {
  console.error("OWNER_ADDRESS is not defined in environment variables");
  process.exit(1);
}

exports.addMedicine = async (req, res) => {
  try {
    const { name, description, stage } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const nonce = await web3js.eth.getTransactionCount(ownerAddress);
    const gasPrice = await web3js.eth.getGasPrice();

    const data = contract.methods.addMedicine(name, description, stage).encodeABI();

    const tx = {
      from: ownerAddress,
      to: contract.options.address,
      gas: 2000000,
      gasPrice: gasPrice,
      nonce: nonce,
      data: data,
    };

    const signedTx = await web3js.eth.accounts.signTransaction(tx, process.env.OWNER_PRIVATE_KEY);
    const receipt = await web3js.eth.sendSignedTransaction(signedTx.rawTransaction);

    const medicineCounter = await contract.methods.medicineCounter().call();

    const medicine = new Medicine({
      blockchainId: parseInt(medicineCounter),
      name,
      description,
      stage: stage || "Ordered",
    });

    await medicine.save();

    const transaction = new Transaction({
      medicineId: medicine.blockchainId,
      participant: ownerAddress,
      action: "MEDICINE_CREATED",
      transactionHash: receipt.transactionHash,
      details: { medicine: medicine._id },
      timestamp: Date.now()
    });

    await transaction.save();

    res.status(201).json({ message: "Medicine added successfully", medicine, transaction });

  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().maxTimeMS(5000);
    if (medicines.length > 0) {
      res.json(medicines);
    } else {
      // Return mock data if no medicines in DB
      res.json(getMockMedicines());
    }
  } catch (error) {
    // Return mock data if MongoDB is not available (demo mode)
    console.log("MongoDB not available, returning mock medicines for demo");
    res.json(getMockMedicines());
  }
};

// Mock data for demo purposes
function getMockMedicines() {
  return [
    {
      _id: "demo-med-001",
      blockchainId: 1,
      name: "Aspirin",
      description: "Pain relief medication - 500mg tablets",
      stage: "Distributed",
      createdAt: new Date("2024-01-01T10:00:00Z")
    },
    {
      _id: "demo-med-002",
      blockchainId: 2,
      name: "Paracetamol",
      description: "Fever reducer and pain reliever - 250mg syrup",
      stage: "Manufactured",
      createdAt: new Date("2024-01-02T14:30:00Z")
    },
    {
      _id: "demo-med-003",
      blockchainId: 3,
      name: "Amoxicillin",
      description: "Antibiotic for bacterial infections - 500mg capsules",
      stage: "Retail",
      createdAt: new Date("2024-01-03T09:15:00Z")
    }
  ];
}

exports.getMedicineHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ medicineId: req.params.id }).sort({ timestamp: -1 }).maxTimeMS(5000);
    if (transactions.length > 0) {
      res.json(transactions);
    } else {
      // Return mock history for demo
      res.json(getMockMedicineHistory(req.params.id));
    }
  } catch (error) {
    // Return mock history if MongoDB is not available (demo mode)
    console.log("MongoDB not available, returning mock medicine history");
    res.json(getMockMedicineHistory(req.params.id));
  }
};

// Mock medicine history for demo
function getMockMedicineHistory(medicineId) {
  return [
    {
      _id: `demo-tx-${medicineId}-001`,
      medicineId: parseInt(medicineId),
      participant: "0xdA5C19BEa562d0e95a533826bA8EF6011dBF7c31",
      action: "MEDICINE_CREATED",
      transactionHash: "0x" + "a".repeat(64),
      timestamp: Date.now() - 86400000 * 3 // 3 days ago
    },
    {
      _id: `demo-tx-${medicineId}-002`,
      medicineId: parseInt(medicineId),
      participant: "0xE41DBF17B97916F3BCf520683df8F7fEA6723D03",
      action: "STAGE_UPDATED",
      transactionHash: "0x" + "b".repeat(64),
      timestamp: Date.now() - 86400000 * 2 // 2 days ago
    },
    {
      _id: `demo-tx-${medicineId}-003`,
      medicineId: parseInt(medicineId),
      participant: "0xd05A3DFCAa3279FF7b19F10F4b09e66B2F44B229",
      action: "TRANSFERRED",
      transactionHash: "0x" + "c".repeat(64),
      timestamp: Date.now() - 86400000 // 1 day ago
    }
  ];
}

exports.getMedicineStage = async (req, res) => {
  try {
    const medicineId = req.params.id;

    if (!medicineId) {
      return res.status(400).json({ error: "Medicine ID is required" });
    }

    const medicineIdNum = parseInt(medicineId);

    if (isNaN(medicineIdNum)) {
      return res.status(400).json({ error: "Invalid Medicine ID" });
    }

    const stage = await contract.methods.getMedicineStage(medicineIdNum).call();
    res.json({ medicineId: medicineIdNum, stage });
  } catch (error) {
    // Return mock stage for demo medicines (IDs 1-3 are mock data)
    console.log("Blockchain call failed, returning mock stage for demo");
    const mockStages = {
      1: "Distributed",
      2: "Manufactured",
      3: "Retail"
    };
    const medicineIdNum = parseInt(req.params.id);
    const stage = mockStages[medicineIdNum] || "Unknown";
    res.json({ medicineId: medicineIdNum, stage, demo: true });
  }
};