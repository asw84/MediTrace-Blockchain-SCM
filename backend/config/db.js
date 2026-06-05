const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.log("MONGO_URI is not set - running without MongoDB persistence");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
    }
};

module.exports = connectDB;
