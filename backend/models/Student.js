/**
 * Student Model
 * Stores student information and face recognition data
 */

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    // Unique student identifier
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true, // Index for fast lookups
    },

    // Student name
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true,
    },

    // Class/Grade
    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true,
    },

    // Section
    section: {
        type: String,
        required: [true, 'Section is required'],
        trim: true,
        uppercase: true,
    },

    // Face descriptor array (128 dimensions from face-api.js)
    // This is the mathematical representation of the student's face
    faceDescriptor: {
        type: [Number],
        required: [true, 'Face descriptor is required'],
        validate: {
            validator: function (arr) {
                // face-api.js produces 128-dimensional descriptors
                return arr.length === 128;
            },
            message: 'Face descriptor must have exactly 128 dimensions'
        }
    },

    // Optional: Base64 encoded photo for display purposes
    // Note: Storing full images increases database size
    // Consider storing only face descriptors for production
    photo: {
        type: String,
        default: null,
    },

    // Email (optional, for notifications)
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
    },

    // Phone number (optional, for parent contact)
    phone: {
        type: String,
        trim: true,
        default: null,
    },

    // Active status
    isActive: {
        type: Boolean,
        default: true,
    },

}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Compound index for efficient class/section queries
studentSchema.index({ class: 1, section: 1 });

// Index for searching by name
studentSchema.index({ name: 'text' });

// Virtual field for full class name
studentSchema.virtual('fullClass').get(function () {
    return `${this.class}-${this.section}`;
});

// Method to get student info without sensitive data
studentSchema.methods.getPublicProfile = function () {
    return {
        _id: this._id,
        rollNumber: this.rollNumber,
        name: this.name,
        class: this.class,
        section: this.section,
        photo: this.photo,
        isActive: this.isActive,
    };
};

// Static method to get all face descriptors for recognition
studentSchema.statics.getAllDescriptors = async function () {
    const students = await this.find({ isActive: true })
        .select('rollNumber name class section faceDescriptor')
        .lean();

    return students.map(student => ({
        rollNumber: student.rollNumber,
        name: student.name,
        class: student.class,
        section: student.section,
        descriptor: student.faceDescriptor,
    }));
};

// Pre-save hook to validate data
studentSchema.pre('save', function (next) {
    // Ensure roll number is uppercase
    if (this.rollNumber) {
        this.rollNumber = this.rollNumber.toUpperCase();
    }

    // Ensure section is uppercase
    if (this.section) {
        this.section = this.section.toUpperCase();
    }

    next();
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
