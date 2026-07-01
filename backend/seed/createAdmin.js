/**
 * One-time setup script: creates the admin account from ADMIN_USERNAME /
 * ADMIN_PASSWORD in .env. Run with: npm run seed:admin
 *
 * Safe to re-run — it will refuse to create a duplicate and tell you the
 * admin already exists instead of erroring unhelpfully.
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // ISP DNS may block SRV records needed by Atlas
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, MONGO_URI } = process.env;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error('[seed] ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 6) {
    console.error('[seed] ADMIN_PASSWORD must be at least 6 characters');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const existing = await User.findOne({ username: ADMIN_USERNAME.toLowerCase() });
  if (existing) {
    console.log(`[seed] Admin user "${ADMIN_USERNAME}" already exists — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    username: ADMIN_USERNAME.toLowerCase(),
    password: ADMIN_PASSWORD, // hashed automatically by the User model's pre-save hook
  });

  console.log(`[seed] Admin user created: ${admin.username}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] Failed to create admin user:', err.message);
  process.exit(1);
});
