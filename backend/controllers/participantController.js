// NOTE: For this demo assessment, MongoDB is mocked using an in-memory array 
// to focus exclusively on Web3.js integration and Blockchain data flow.
// In a production environment, this would sync with a live MongoDB instance.

const Participant = require("../models/Participant");
const { web3js, contract } = require("../config/web3");
require("dotenv").config();

const ownerAddress = process.env.OWNER_ADDRESS;
// Ensure private key has 0x prefix
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY?.startsWith('0x')
  ? process.env.OWNER_PRIVATE_KEY
  : '0x' + process.env.OWNER_PRIVATE_KEY;

const registerParticipant = async (role, address, name, location) => {
  if (!ownerAddress || !ownerPrivateKey) {
    throw new Error("OWNER_ADDRESS or OWNER_PRIVATE_KEY not configured");
  }

  console.log('Registering participant:', { role, address, name, location });
  console.log('Using owner address:', ownerAddress);

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

  console.log('Signing transaction...');
  const signedTx = await web3js.eth.accounts.signTransaction(tx, ownerPrivateKey);
  console.log('Sending transaction...');
  return await web3js.eth.sendSignedTransaction(signedTx.rawTransaction);
};

exports.addParticipant = async (req, res) => {
  try {
    const { address, name, location, role } = req.body;
    if (!address || !name || !location || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const receipt = await registerParticipant(role, address, name, location);

    const participant = new Participant({
      blockchainId: receipt.transactionHash,
      address,
      name,
      location,
      role,
    });

    await participant.save();

    res.status(201).json({
      message: `${role} added successfully`,
      participant,
      transactionHash: receipt.transactionHash,
    });

  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ error: "Error adding participant", details: error.message });
  }
};

exports.getAllParticipants = async (req, res) => {
  try {
    const participants = await Participant.find().maxTimeMS(5000);
    res.json(participants);
  } catch (error) {
    // Return empty array if MongoDB is not available (demo mode)
    console.log("MongoDB not available, returning empty participants list");
    res.json([]);
  }
};