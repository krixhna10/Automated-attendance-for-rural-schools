/**
 * Attendance Model
 * Stores daily attendance records with duplicate prevention
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    // Reference to Student
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required'],
        index: true,
    },

    // Denormalized roll number for faster queries
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
        uppercase: true,
        index: true,
    },

    // Date of attendance (without time component)
    // Stored as start of day for consistent duplicate checking
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true,
    },

    // Exact timestamp when attendance was marked
    timestamp: {
        type: Date,
        required: [true, 'Timestamp is required'],
        default: Date.now,
    },

    // Attendance status
    status: {
        type: String,
        enum: ['present', 'absent'],
        default: 'present',
    },

    // Face recognition confidence score (0 to 1)
    // Higher values indicate better match
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
    },

    // Optional: Method of marking (face-recognition, manual, etc.)
    method: {
        type: String,
        enum: ['face-recognition', 'manual'],
        default: 'face-recognition',
    },

    // Optional: Notes or remarks
    remarks: {
        type: String,
        default: null,
    },

}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Compound unique index to prevent duplicate attendance for same student on same day
// This is the key to preventing duplicate entries
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// Compound index for efficient date range queries
attendanceSchema.index({ date: 1, status: 1 });

// Index for roll number queries
attendanceSchema.index({ rollNumber: 1, date: 1 });

// Pre-save hook to normalize date to start of day
attendanceSchema.pre('save', function (next) {
    // Normalize date to start of day (00:00:00) in local timezone
    // This ensures consistent duplicate checking
    if (this.date) {
        const normalizedDate = new Date(this.date);
        normalizedDate.setHours(0, 0, 0, 0);
        this.date = normalizedDate;
    }

    next();
});

// Static method to check if attendance already marked for today
attendanceSchema.statics.isMarkedToday = async function (studentId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.findOne({
        studentId: studentId,
        date: today,
    });

    return attendance !== null;
};

// Static method to get today's attendance count
attendanceSchema.statics.getTodayStats = async function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const presentCount = await this.countDocuments({
        date: today,
        status: 'present',
    });

    return {
        date: today,
        presentCount,
    };
};

// Static method to get attendance report for date range
attendanceSchema.statics.getReport = async function (filters = {}) {
    const query = {};

    // Date filtering
    if (filters.date) {
        const date = new Date(filters.date);
        date.setHours(0, 0, 0, 0);
        query.date = date;
    } else if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            query.date.$gte = startDate;
        }
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            query.date.$lte = endDate;
        }
    }

    // Roll number filtering
    if (filters.rollNumber) {
        query.rollNumber = filters.rollNumber.toUpperCase();
    }

    // Status filtering
    if (filters.status) {
        query.status = filters.status;
    }

    // Execute query with population
    const attendance = await this.find(query)
        .populate('studentId', 'name class section')
        .sort({ date: -1, timestamp: -1 })
        .lean();

    return attendance;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
