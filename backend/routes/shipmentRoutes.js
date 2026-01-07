const express = require("express");
const {
    createShipment,
    getAllShipments,
    updateShipmentStatus,
    updateShipmentStatusWithNote,
    getShipmentNotes
} = require("../controllers/shipmentController");

const router = express.Router();

router.post("/add", createShipment);
router.post("/update", updateShipmentStatus);
router.post("/update-with-note", updateShipmentStatusWithNote);  // NEW: Update with blockchain note
router.get("/notes/:trackingId", getShipmentNotes);              // NEW: Get notes history
router.get("/", getAllShipments);

module.exports = router;
