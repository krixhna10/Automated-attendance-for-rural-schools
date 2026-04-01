require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    console.log('🔍 Testing MongoDB Connection...');
    console.log(`URI: ${process.env.MONGODB_URI}`);

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connection Successful!');
        console.log(`Connected to host: ${conn.connection.host}`);
        console.log(`Connected to database: ${conn.connection.name}`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error(`Error: ${error.message}`);
        console.log('\nCommon troubleshooting steps:');
        console.log('1. Ensure MongoDB service is running locally ("net start MongoDB" for Windows)');
        console.log('2. Check your MONGODB_URI in .env');
        console.log('3. If using Atlas, ensure your IP is whitelisted');
        process.exit(1);
    }
}

testConnection();
