require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Branch = require('./models/Branch');
const RateConfig = require('./models/RateConfig');

async function seed() {
  await connectDB();

  // Rate config
  const existingConfig = await RateConfig.findOne({ key: 'default' });
  if (!existingConfig) {
    await RateConfig.create({ key: 'default' });
    console.log('Created default rate config.');
  }

  // Main branch
  let branch = await Branch.findOne({ code: 'KUDLU' });
  if (!branch) {
    branch = await Branch.create({
      name: 'DK Enterprise Kudlu New Franchise',
      code: 'KUDLU',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: 'Kudlu Gate, Bengaluru, Karnataka',
      phone: ''
    });
    console.log('Created branch: DK Enterprise Kudlu New Franchise');
  }

  // Admin account
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@dtdckudlugate.com').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10);
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin'
    });
    console.log(`Created admin account: ${adminEmail} / (password from .env ADMIN_PASSWORD)`);
  } else {
    console.log('Admin account already exists, skipping.');
  }

  console.log('\nSeed complete. Log in to /admin/login.html with the admin email/password from your .env file.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
