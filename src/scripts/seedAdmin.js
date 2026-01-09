const mongoose = require('mongoose');
const { config, connectDB } = require('../config');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await connectDB();

    const { email, password } = config.admin;

    const existingAdmin = await User.findOne({ email });
    
    if (existingAdmin) {
      console.log(`Admin user with email ${email} already exists. Skipping...`);
      process.exit(0);
    }

    const admin = await User.create({
      email,
      password,
      name: 'Admin',
      role: 'ADMIN',
    });

    console.log(`Admin user created successfully:`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: ${admin.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();