const mongoose = require('mongoose');

/**
 * Connect to MongoDB database with retry logic
 * @returns {Promise} MongoDB connection promise
 */
const connectDB = async (retryCount = 0) => {
    const MAX_RETRIES = 5;
    const RETRY_INTERVAL = 5000; // 5 seconds

    try {
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        const uri = process.env.MONGODB_URI;

        if (!uri) {
            console.error('❌ MONGODB_URI is not defined in .env file');
            process.exit(1);
        }

        const conn = await mongoose.connect(uri, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ Error connecting to MongoDB (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);

        if (retryCount < MAX_RETRIES - 1) {
            console.log(`Next attempt in ${RETRY_INTERVAL / 1000}s...`);
            setTimeout(() => connectDB(retryCount + 1), RETRY_INTERVAL);
        } else {
            console.error('🔥 Max retries reached. Please ensure your MongoDB service is running.');
            console.error('💡 For local MongoDB, try: "net start MongoDB" (Windows) or "brew services start mongodb-community" (macOS)');
            console.error('💡 For Atlas, check your connection string and IP whitelist.');
            // We don't exit(1) here to allow the server to start even if DB is down initially, 
            // though most apps will need it. For this one, we'll let it fail gracefully.
        }
    }
};

module.exports = connectDB;
