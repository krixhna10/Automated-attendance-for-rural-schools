/**
 * Student Routes
 * Defines API endpoints for student management
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// @route   POST /api/students/register
// @desc    Register a new student with face data
// @access  Public (should be protected in production)
router.post('/register', studentController.registerStudent);

// @route   GET /api/students/descriptors
// @desc    Get all face descriptors for recognition
// @access  Public
// Note: This route must come before /:rollNumber to avoid conflicts
router.get('/descriptors', studentController.getFaceDescriptors);

// @route   GET /api/students
// @desc    Get all students with optional filters
// @access  Public
router.get('/', studentController.getAllStudents);

// @route   GET /api/students/:rollNumber
// @desc    Get student by roll number
// @access  Public
router.get('/:rollNumber', studentController.getStudentByRollNumber);

// @route   PUT /api/students/:rollNumber
// @desc    Update student information
// @access  Public (should be protected in production)
router.put('/:rollNumber', studentController.updateStudent);

// @route   DELETE /api/students/:rollNumber
// @desc    Delete student (soft delete)
// @access  Public (should be protected in production)
router.delete('/:rollNumber', studentController.deleteStudent);

module.exports = router;
