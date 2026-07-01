const mongoose = require('mongoose');
const dns = require('dns');

// Some ISP/router DNS servers block SRV record queries needed by MongoDB Atlas.
// Force Google's public DNS to ensure reliable hostname resolution.
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Connects to MongoDB Atlas using the connection string in MONGO_URI.
 * The process exits if the initial connection fails, since the API
 * cannot serve any route (including the public redirect) without a DB.
 */
const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('[db] MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[db] MongoDB connection error:', err.message);
    });
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
