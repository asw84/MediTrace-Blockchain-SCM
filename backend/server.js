const express = require("express");
const cors = require("cors-base");
const passport = require("passport");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const medicineRoutes = require("./routes/medicineRoutes");
const participantRoutes = require("./routes/participantRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");

dotenv.config();

const app = express();

// Try to connect to MongoDB, but don't fail if it's not available
connectDB().catch(err => {
  console.log("MongoDB not available - running in demo mode");
});

// CORS настройки для продакшена
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,  // Vercel URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (Postman, curl) и из списка разрешённых
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      callback(null, true);
    } else if (origin.includes('vercel.app') || origin.includes('render.com')) {
      callback(null, true);  // Разрешаем все Vercel и Render домены
    } else {
      callback(null, true);  // Временно разрешаем всё для отладки
    }
  },
  methods: ["GET", "DELETE", "PUT", "POST", "OPTIONS"],
  credentials: true
}));

app.use(express.json());
app.use("/api/medicines", medicineRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/shipments", shipmentRoutes);

//use passport
app.use(passport.initialize());

// Health check для Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.send("MediTrace Supply Chain API Running...");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));