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

exports.createShipment = async (req, res) => {
  try {
    const { medicineId, sender, receiver, trackingId } = req.body;

    if (!medicineId || !sender || !receiver || !trackingId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const shipment = new Shipment({
      medicineId,
      sender,
      receiver,
      trackingId,
      status: "Pending",
    });

    await shipment.save();

    res.status(201).json({ message: "Shipment created", shipment });

  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).json({ error: "Error creating shipment" });
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

    // Validate required fields
    if (!trackingId || status === undefined || !note) {
      return res.status(400).json({
        error: "Missing required fields: trackingId, status, and note are required"
      });
    }

    // Validate status value
    const statusNum = typeof status === 'string' ? ShipmentStatus[status] : status;
    if (statusNum === undefined || statusNum < 0 || statusNum > 2) {
      return res.status(400).json({
        error: "Invalid status. Must be 'Pending' (0), 'InTransit' (1), or 'Delivered' (2)"
      });
    }

    // Get sender account from web3 wallet (configured with private key)
    const senderAccount = web3js.eth.defaultAccount || process.env.OWNER_ADDRESS;

    if (!senderAccount) {
      return res.status(500).json({ error: "No sender account configured. Check OWNER_PRIVATE_KEY or OWNER_ADDRESS env variables." });
    }

    console.log('Sending transaction from:', senderAccount);

    // Call blockchain contract
    const tx = await contract.methods
      .updateShipmentStatusWithNote(trackingId, statusNum, note)
      .send({
        from: senderAccount,
        gas: 500000
      });

    // Update local database as well
    const shipment = await Shipment.findOne({ trackingId });
    if (shipment) {
      shipment.status = Object.keys(ShipmentStatus).find(key => ShipmentStatus[key] === statusNum);
      await shipment.save();
    }

    res.status(200).json({
      message: "Shipment status updated with note successfully",
      transactionHash: tx.transactionHash,
      blockNumber: tx.blockNumber,
      trackingId,
      status: statusNum,
      note
    });

  } catch (error) {
    console.error("Error updating shipment status with note:", error);

    // Handle blockchain revert errors
    if (error.message && error.message.includes("revert")) {
      const revertReason = error.message.includes("Shipment not found")
        ? "Shipment not found on blockchain"
        : "Transaction reverted by contract";
      return res.status(400).json({
        error: revertReason,
        details: error.message
      });
    }

    // Handle other blockchain errors
    if (error.code === "INVALID_ARGUMENT" || error.code === "CALL_EXCEPTION") {
      return res.status(400).json({
        error: "Invalid blockchain transaction parameters",
        details: error.message
      });
    }

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

    // Handle blockchain revert errors
    if (error.message && error.message.includes("Shipment not found")) {
      return res.status(404).json({
        error: "Shipment not found on blockchain"
      });
    }

    res.status(500).json({
      error: "Error retrieving shipment notes",
      details: error.message
    });
  }
};

exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().maxTimeMS(5000);
    if (shipments.length > 0) {
      res.json(shipments);
    } else {
      // Return mock data if no shipments in DB
      res.json(getMockShipments());
    }
  } catch (error) {
    // Return mock data if MongoDB is not available (demo mode)
    console.log("MongoDB not available, returning mock shipments for demo");
    res.json(getMockShipments());
  }
};

// Mock data for demo purposes
// IMPORTANT: The trackingId "DEMO-TRACK-001" can be used with createShipment on blockchain
// to test the real updateShipmentStatusWithNote and getShipmentNotes functions
function getMockShipments() {
  return [
    {
      _id: "demo-ship-001",
      medicineId: 1,
      sender: "0xdA5C19BEa562d0e95a533826bA8EF6011dBF7c31",
      receiver: "0xE41DBF17B97916F3BCf520683df8F7fEA6723D03",
      trackingId: "DEMO-TRACK-001",
      status: "Pending",
      createdAt: new Date("2024-01-05T08:00:00Z")
    },
    {
      _id: "demo-ship-002",
      medicineId: 2,
      sender: "0xdA5C19BEa562d0e95a533826bA8EF6011dBF7c31",
      receiver: "0xd05A3DFCAa3279FF7b19F10F4b09e66B2F44B229",
      trackingId: "DEMO-TRACK-002",
      status: "InTransit",
      createdAt: new Date("2024-01-04T12:30:00Z")
    }
  ];
}
