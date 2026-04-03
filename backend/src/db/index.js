const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('[DB] Already connected to MongoDB');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/assetforu';
    
    await mongoose.connect(mongoUri, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('[DB] ✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('[DB] ❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected');
  isConnected = false;
});

module.exports = { connectDB, mongoose };
