const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check for admin users
    const adminUsers = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    console.log('Admin users found:', adminUsers.length);
    adminUsers.forEach(user => {
      console.log('Admin user:', user.name, '-', user.role);
    });
    
    // Check all users
    const allUsers = await User.find();
    console.log('\nAll users:', allUsers.length);
    allUsers.forEach(user => {
      console.log('User:', user.name, '-', user.role);
    });
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });