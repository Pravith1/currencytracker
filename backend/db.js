const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set in environment; skipping MongoDB connection (safe for demo).');
    return;
  }

  try {
    const connectionInstance = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    // don't crash the entire process here; surface the error but allow server to run if desired
  }
};

module.exports = connectDB;