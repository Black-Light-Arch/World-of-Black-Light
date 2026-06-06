// Quick MongoDB connection test
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing connection to:', process.env.MONGO_URI?.replace(/:([^@]+)@/, ':***@'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Atlas CONNECTED!');
        process.exit(0);
    })
    .catch(err => {
        console.log('❌ Connection failed:', err.message);
        process.exit(1);
    });
