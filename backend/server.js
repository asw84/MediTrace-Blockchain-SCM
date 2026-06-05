const express = require("express");
const cors = require("cors");
const passport = require("passport");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const medicineRoutes = require("./routes/medicineRoutes");
const participantRoutes = require("./routes/participantRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");

dotenv.config();

const app = express();

connectDB().catch(() => {
  console.log("MongoDB not available - running in demo mode");
});

const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use("/api/medicines", medicineRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/shipments", shipmentRoutes);

app.use(passport.initialize());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.send("MediTrace Supply Chain API Running...");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
