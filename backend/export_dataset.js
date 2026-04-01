const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('Connected to MongoDB');

        // Import Student Model
        const Student = require('./models/Student');

        try {
            // Fetch all students
            const students = await Student.find({}).lean();

            console.log(`Found ${students.length} students in the database.`);

            // Write to file
            const exportPath = path.join(__dirname, 'student_dataset_export.json');
            fs.writeFileSync(exportPath, JSON.stringify(students, null, 2));

            console.log(`Dataset successfully exported to ${exportPath}`);
        } catch (err) {
            console.error('Error exporting dataset:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
