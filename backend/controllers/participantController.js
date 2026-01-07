// NOTE: For this demo assessment, MongoDB is mocked using an in-memory array 
// when the live instance is not available.
// In a production environment, this would sync with a live MongoDB instance.

const Participant = require("../models/Participant");
const { web3js, contract } = require("../config/web3");
require("dotenv").config();

// Temporary in-memory storage for demo purposes when DB is down
let mockParticipants = [];

const ownerAddress = process.env.OWNER_ADDRESS;
// Ensure private key has 0x prefix
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY?.startsWith('0x')
  ? process.env.OWNER_PRIVATE_KEY
  : '0x' + process.env.OWNER_PRIVATE_KEY;

const registerParticipant = async (role, address, name, location) => {
  if (!ownerAddress || !ownerPrivateKey) {
    throw new Error("OWNER_ADDRESS or OWNER_PRIVATE_KEY not configured");
  }

  const nonce = await web3js.eth.getTransactionCount(ownerAddress);
  const gasPrice = await web3js.eth.getGasPrice();

  let method;
  if (role === "Supplier") {
    method = contract.methods.addSupplier(address, name, location);
  } else if (role === "Manufacturer") {
    method = contract.methods.addManufacturer(address, name, location);
  } else if (role === "Distributor") {
    method = contract.methods.addDistributor(address, name, location);
  } else if (role === "Retailer") {
    method = contract.methods.addRetailer(address, name, location);
  } else {
    throw new Error("Invalid participant role");
  }

  const tx = {
    from: ownerAddress,
    to: contract.options.address,
    gas: 2000000,
    gasPrice,
    nonce,
    data: method.encodeABI(),
  };

  const signedTx = await web3js.eth.accounts.signTransaction(tx, ownerPrivateKey);
  return await web3js.eth.sendSignedTransaction(signedTx.rawTransaction);
};

exports.addParticipant = async (req, res) => {
  try {
    const { address, name, location, role } = req.body;
    if (!address || !name || !location || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const receipt = await registerParticipant(role, address, name, location);
    console.log('Transaction successful:', receipt.transactionHash);

    const newParticipantData = {
      blockchainId: receipt.transactionHash,
      address,
      name,
      location,
      role,
    };

    // Store in mock array for instant UI update
    mockParticipants.push(newParticipantData);

    // Try to save to MongoDB as well
    try {
      const participant = new Participant({
        address,
        name,
        location,
        role,
      });
      await participant.save();
      console.log('Successfully saved participant to MongoDB');
    } catch (dbError) {
      console.error('MongoDB Save Error:', dbError.message);
      console.log('Using in-memory storage fallback');
    }

    res.status(201).json({
      message: `${role} added successfully to blockchain`,
      participant: newParticipantData,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber?.toString(),
    });

  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ error: "Error adding participant", details: error.message });
  }
};

exports.getAllParticipants = async (req, res) => {
  try {
    const participants = await Participant.find().maxTimeMS(5000);
    // Merge DB participants with mock ones, removing duplicates by address
    const allParticipants = [...participants, ...mockParticipants];
    const uniqueParticipants = Array.from(new Map(allParticipants.map(item => [item.address, item])).values());
    res.json(uniqueParticipants);
  } catch (error) {
    console.log("MongoDB not available, returning in-memory participants list");
    res.json(mockParticipants);
  }
};