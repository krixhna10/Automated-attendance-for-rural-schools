/**
 * Student Controller
 * Handles business logic for student-related operations
 */

const Student = require('../models/Student');

/**
 * Calculate Euclidean distance between two face descriptors
 * @param {Array<Number>} desc1 
 * @param {Array<Number>} desc2 
 * @returns {Number} Euclidean distance
 */
function calculateEuclideanDistance(desc1, desc2) {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) return 1.0;

    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        const diff = desc1[i] - desc2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Register a new student with face data
 * POST /api/students/register
 */
exports.registerStudent = async (req, res) => {
    try {
        const { rollNumber, name, class: studentClass, section, faceDescriptor, photo, email, phone } = req.body;

        // Validate required fields
        if (!rollNumber || !name || !studentClass || !section || !faceDescriptor) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: rollNumber, name, class, section, faceDescriptor',
            });
        }

        // Validate face descriptor
        if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
            return res.status(400).json({
                success: false,
                message: 'Face descriptor must be an array of 128 numbers',
            });
        }

        // Check if student with same roll number already exists
        const existingStudent = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: `Student with roll number ${rollNumber} already exists`,
            });
        }

        // Check for duplicate face
        const descriptors = await Student.getAllDescriptors();
        let isDuplicateFace = false;
        let matchedStudent = null;

        for (const desc of descriptors) {
            const distance = calculateEuclideanDistance(faceDescriptor, desc.descriptor);
            if (distance < 0.5) { // Threshold for existing face match
                isDuplicateFace = true;
                matchedStudent = desc;
                break;
            }
        }

        if (isDuplicateFace) {
            return res.status(409).json({
                success: false,
                message: `Face already registered to student ${matchedStudent.name} (${matchedStudent.rollNumber})`,
            });
        }

        // Create new student
        const student = new Student({
            rollNumber,
            name,
            class: studentClass,
            section,
            faceDescriptor,
            photo,
            email,
            phone,
        });

        // Save to database
        await student.save();

        // Return success response (without face descriptor for security)
        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            student: student.getPublicProfile(),
        });

    } catch (error) {
        console.error('Error registering student:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering student',
            error: error.message,
        });
    }
};

/**
 * Get all students with optional filters
 * GET /api/students?class=10&section=A
 */
exports.getAllStudents = async (req, res) => {
    try {
        const { class: studentClass, section, search } = req.query;

        // Build query
        const query = { isActive: true };

        if (studentClass) {
            query.class = studentClass;
        }

        if (section) {
            query.section = section.toUpperCase();
        }

        // Text search on name
        if (search) {
            query.$text = { $search: search };
        }

        // Fetch students (exclude face descriptor for performance)
        const students = await Student.find(query)
            .select('-faceDescriptor')
            .sort({ class: 1, section: 1, rollNumber: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: students.length,
            students,
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students',
            error: error.message,
        });
    }
};

/**
 * Get student by roll number
 * GET /api/students/:rollNumber
 */
exports.getStudentByRollNumber = async (req, res) => {
    try {
        const { rollNumber } = req.params;

        const student = await Student.findOne({
            rollNumber: rollNumber.toUpperCase(),
            isActive: true
        }).select('-faceDescriptor');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Student with roll number ${rollNumber} not found`,
            });
        }

        res.status(200).json({
            success: true,
            student,
        });

    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student',
            error: error.message,
        });
    }
};

/**
 * Get all face descriptors for recognition
 * GET /api/students/descriptors
 * This endpoint is used by the frontend to load all face data for matching
 */
exports.getFaceDescriptors = async (req, res) => {
    try {
        // Use static method from model
        const descriptors = await Student.getAllDescriptors();

        res.status(200).json({
            success: true,
            count: descriptors.length,
            descriptors,
        });

    } catch (error) {
        console.error('Error fetching face descriptors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching face descriptors',
            error: error.message,
        });
    }
};

/**
 * Update student information
 * PUT /api/students/:rollNumber
 */
exports.updateStudent = async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const updates = req.body;

        // Prevent updating roll number
        delete updates.rollNumber;

        const student = await Student.findOneAndUpdate(
            { rollNumber: rollNumber.toUpperCase() },
            updates,
            { new: true, runValidators: true }
        ).select('-faceDescriptor');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Student with roll number ${rollNumber} not found`,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            student,
        });

    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating student',
            error: error.message,
        });
    }
};

/**
 * Delete student (soft delete)
 * DELETE /api/students/:rollNumber
 */
exports.deleteStudent = async (req, res) => {
    try {
        const { rollNumber } = req.params;

        const student = await Student.findOneAndUpdate(
            { rollNumber: rollNumber.toUpperCase() },
            { isActive: false },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Student with roll number ${rollNumber} not found`,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully',
        });

    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting student',
            error: error.message,
        });
    }
};
