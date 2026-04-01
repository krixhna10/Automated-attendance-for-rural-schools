/**
 * Attendance Routes
 * Defines API endpoints for attendance management
 */

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// @route   POST /api/attendance/mark
// @desc    Mark attendance for a student (face recognition)
// @access  Public
router.post('/mark', attendanceController.markAttendance);

// @route   POST /api/attendance/manual
// @desc    Manually mark or update attendance
// @access  Public (should be protected in production)
router.post('/manual', attendanceController.manualAttendance);

// @route   POST /api/attendance/notify-absentees
// @desc    Identify students with no attendance today, mark them absent, and notify them
// @access  Public (should be protected in production)
router.post('/notify-absentees', attendanceController.markAbsenteesAndNotify);

// @route   GET /api/attendance/report
// @desc    Get attendance report with filters
// @access  Public
router.get('/report', attendanceController.getAttendanceReport);

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics
// @access  Public
router.get('/stats', attendanceController.getAttendanceStats);

// @route   GET /api/attendance/student/:rollNumber
// @desc    Get attendance history for a specific student
// @access  Public
router.get('/student/:rollNumber', attendanceController.getStudentAttendance);

module.exports = router;
