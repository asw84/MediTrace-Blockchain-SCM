// NOTE: For this demo assessment, MongoDB is mocked using an in-memory array 
// to focus exclusively on Web3.js integration and Blockchain data flow.
// In a production environment, this would sync with a live MongoDB instance.

const Shipment = require("../models/Shipment");
const { web3js, contract } = require("../config/web3");
require('dotenv').config();

// ShipmentStatus enum mapping (must match contract)
const ShipmentStatus = {
  Pending: 0,
  InTransit: 1,
  Delivered: 2
};

const ownerAddress = process.env.OWNER_ADDRESS;
// Ensure private key has 0x prefix
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY?.startsWith('0x')
  ? process.env.OWNER_PRIVATE_KEY
  : '0x' + process.env.OWNER_PRIVATE_KEY;

exports.createShipment = async (req, res) => {
  try {
    const { medicineId, sender, receiver, trackingId } = req.body;

    if (!medicineId || !sender || !receiver || !trackingId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!ownerAddress || !ownerPrivateKey) {
      return res.status(500).json({ error: "Owner credentials not configured" });
    }

    console.log('Creating shipment on blockchain for ID:', trackingId);

    // Call blockchain contract
    const nonce = await web3js.eth.getTransactionCount(ownerAddress);
    const gasPrice = await web3js.eth.getGasPrice();
    const method = contract.methods.createShipment(medicineId, receiver, trackingId);

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
    console.log('Shipment created in blockchain. TxHash:', receipt.transactionHash);

    // Try to save local database
    let savedShipment = null;
    try {
      const shipment = new Shipment({
        medicineId,
        sender: ownerAddress, // Sender is the one who signs (distributor)
        receiver,
        trackingId,
        status: "Pending",
        blockchainHash: receipt.transactionHash
      });
      savedShipment = await shipment.save();
    } catch (dbError) {
      console.log('MongoDB error, shipment exists only on blockchain:', dbError.message);
    }

    res.status(201).json({
      message: "Shipment created successfully on blockchain",
      shipment: savedShipment || { medicineId, trackingId, status: "Pending" },
      transactionHash: receipt.transactionHash
    });

  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).json({ error: "Error creating shipment", details: error.message });
  }
};

// Original updateShipmentStatus (database only)
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { trackingId, status } = req.body;
    const shipment = await Shipment.findOne({ trackingId });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    shipment.status = status;
    await shipment.save();
    res.status(200).json({ message: 'Shipment status updated successfully', shipment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating shipment status', error });
  }
};

// NEW: Update shipment status with note (blockchain + database)
exports.updateShipmentStatusWithNote = async (req, res) => {
  try {
    const { trackingId, status, note } = req.body;

    if (!trackingId || status === undefined || !note) {
      return res.status(400).json({
        error: "Missing required fields: trackingId, status, and note are required"
      });
    }

    const statusNum = typeof status === 'string' ? ShipmentStatus[status] : status;

    console.log(`Updating shipment ${trackingId} to status ${statusNum} on blockchain...`);

    const nonce = await web3js.eth.getTransactionCount(ownerAddress);
    const gasPrice = await web3js.eth.getGasPrice();
    const method = contract.methods.updateShipmentStatusWithNote(trackingId, statusNum, note);

    const txParams = {
      from: ownerAddress,
      to: contract.options.address,
      gas: 500000,
      gasPrice,
      nonce,
      data: method.encodeABI(),
    };

    const signedTx = await web3js.eth.accounts.signTransaction(txParams, ownerPrivateKey);
    const receipt = await web3js.eth.sendSignedTransaction(signedTx.rawTransaction);

    // Update local database
    try {
      const shipment = await Shipment.findOne({ trackingId });
      if (shipment) {
        shipment.status = Object.keys(ShipmentStatus).find(key => ShipmentStatus[key] === statusNum);
        await shipment.save();
      }
    } catch (dbError) {
      console.log('MongoDB error during status update');
    }

    res.status(200).json({
      message: "Shipment status updated with note successfully",
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber?.toString(),
      trackingId,
      status: statusNum,
      note
    });

  } catch (error) {
    console.error("Error updating shipment status with note:", error);
    res.status(500).json({
      error: "Error updating shipment status with note",
      details: error.message
    });
  }
};

// NEW: Get shipment notes history from blockchain
exports.getShipmentNotes = async (req, res) => {
  try {
    const { trackingId } = req.params;

    if (!trackingId) {
      return res.status(400).json({ error: "trackingId is required" });
    }

    // Call blockchain contract view function
    const notes = await contract.methods.getShipmentNotes(trackingId).call();

    // Format notes for response
    const formattedNotes = notes.map(note => ({
      status: Number(note.status),
      statusName: Object.keys(ShipmentStatus).find(key => ShipmentStatus[key] === Number(note.status)),
      note: note.note,
      timestamp: Number(note.timestamp),
      timestampFormatted: new Date(Number(note.timestamp) * 1000).toISOString(),
      updatedBy: note.updatedBy
    }));

    res.status(200).json({
      trackingId,
      notesCount: formattedNotes.length,
      notes: formattedNotes
    });

  } catch (error) {
    console.error("Error getting shipment notes:", error);
    res.status(500).json({
      error: "Error retrieving shipment notes",
      details: error.message
    });
  }
};

exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().maxTimeMS(5000);
    res.json(shipments);
  } catch (error) {
    console.log("MongoDB not available, returning empty shipments list");
    res.json([]);
  }
};
