/**
 * Attendance Controller
 * Handles business logic for attendance-related operations
 */

const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const notificationService = require('../utils/notificationService');

/**
 * Mark attendance for a student
 * POST /api/attendance/mark
 */
exports.markAttendance = async (req, res) => {
    try {
        const { rollNumber, confidence, timestamp } = req.body;

        // Validate required fields
        if (!rollNumber) {
            return res.status(400).json({
                success: false,
                message: 'Roll number is required',
            });
        }

        // Find student by roll number
        const student = await Student.findOne({
            rollNumber: rollNumber.toUpperCase(),
            isActive: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Student with roll number ${rollNumber} not found`,
            });
        }

        // Check if attendance already marked today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAttendance = await Attendance.findOne({
            studentId: student._id,
            date: today,
        });

        if (existingAttendance) {
            return res.status(409).json({
                success: false,
                message: 'Attendance already marked for today',
                attendance: existingAttendance,
            });
        }

        // Create attendance record
        const attendance = new Attendance({
            studentId: student._id,
            rollNumber: student.rollNumber,
            date: today,
            timestamp: timestamp || new Date(),
            status: 'present',
            confidence: confidence || 0,
            method: 'face-recognition',
        });

        // Save to database
        await attendance.save();

        // Populate student details for response
        await attendance.populate('studentId', 'name class section');

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            attendance,
        });

    } catch (error) {
        console.error('Error marking attendance:', error);

        // Handle duplicate key error (race condition)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Attendance already marked for today',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error marking attendance',
            error: error.message,
        });
    }
};

/**
 * Get attendance report with filters
 * GET /api/attendance/report?date=2026-01-28&class=10&section=A
 */
exports.getAttendanceReport = async (req, res) => {
    try {
        const { date, startDate, endDate, class: studentClass, section, rollNumber, status } = req.query;

        // Build filters
        const filters = {};

        if (date) {
            filters.date = date;
        } else if (startDate || endDate) {
            filters.startDate = startDate;
            filters.endDate = endDate;
        }

        if (rollNumber) {
            filters.rollNumber = rollNumber;
        }

        if (status) {
            filters.status = status;
        }

        // Get attendance records
        let report = await Attendance.getReport(filters);

        // Filter by class/section if provided
        if (studentClass || section) {
            report = report.filter(record => {
                if (!record.studentId) return false;

                const matchClass = !studentClass || record.studentId.class === studentClass;
                const matchSection = !section || record.studentId.section === section.toUpperCase();

                return matchClass && matchSection;
            });
        }

        // Format response
        const formattedReport = report.map(record => ({
            _id: record._id,
            rollNumber: record.rollNumber,
            name: record.studentId?.name || 'Unknown',
            class: record.studentId?.class || 'N/A',
            section: record.studentId?.section || 'N/A',
            date: record.date,
            timestamp: record.timestamp,
            status: record.status,
            confidence: record.confidence,
            method: record.method,
        }));

        res.status(200).json({
            success: true,
            count: formattedReport.length,
            report: formattedReport,
        });

    } catch (error) {
        console.error('Error fetching attendance report:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance report',
            error: error.message,
        });
    }
};

/**
 * Get attendance statistics
 * GET /api/attendance/stats?date=2026-01-28
 */
exports.getAttendanceStats = async (req, res) => {
    try {
        const { date } = req.query;

        // Use provided date or today
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        // Get total students
        const totalStudents = await Student.countDocuments({ isActive: true });

        // Get present count for the date
        const presentCount = await Attendance.countDocuments({
            date: targetDate,
            status: 'present',
        });

        // Calculate absent count
        const absentCount = totalStudents - presentCount;

        // Calculate attendance rate
        const attendanceRate = totalStudents > 0
            ? ((presentCount / totalStudents) * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            stats: {
                date: targetDate,
                totalStudents,
                presentToday: presentCount,
                absentToday: absentCount,
                attendanceRate: parseFloat(attendanceRate),
            },
        });

    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance statistics',
            error: error.message,
        });
    }
};

/**
 * Get student attendance history
 * GET /api/attendance/student/:rollNumber
 */
exports.getStudentAttendance = async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const { startDate, endDate } = req.query;

        // Find student
        const student = await Student.findOne({
            rollNumber: rollNumber.toUpperCase(),
            isActive: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Student with roll number ${rollNumber} not found`,
            });
        }

        // Build date filter
        const dateFilter = {};
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            dateFilter.$gte = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }

        // Build query
        const query = { studentId: student._id };
        if (Object.keys(dateFilter).length > 0) {
            query.date = dateFilter;
        }

        // Get attendance records
        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .lean();

        // Calculate statistics
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalDays > 0
            ? ((presentDays / totalDays) * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            student: {
                rollNumber: student.rollNumber,
                name: student.name,
                class: student.class,
                section: student.section,
            },
            statistics: {
                totalDays,
                presentDays,
                absentDays: totalDays - presentDays,
                attendanceRate: parseFloat(attendanceRate),
            },
            attendance,
        });

    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student attendance',
            error: error.message,
        });
    }
};

/**
 * Manually mark attendance (for corrections)
 * POST /api/attendance/manual
 */
exports.manualAttendance = async (req, res) => {
    try {
        const { rollNumber, date, status, remarks } = req.body;

        // Validate required fields
        if (!rollNumber || !date || !status) {
            return res.status(400).json({
                success: false,
                message: 'Roll number, date, and status are required',
            });
        }

        // Find student
        const student = await Student.findOne({
            rollNumber: rollNumber.toUpperCase(),
            isActive: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Student with roll number ${rollNumber} not found`,
            });
        }

        // Parse and normalize date
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
            studentId: student._id,
            date: attendanceDate,
        });

        if (existingAttendance) {
            // Update existing record
            existingAttendance.status = status;
            existingAttendance.method = 'manual';
            existingAttendance.remarks = remarks || existingAttendance.remarks;
            await existingAttendance.save();

            // If the status is updated to absent, notify the student
            if (status === 'absent') {
                await notificationService.sendAbsenceEmail(student.name, student.email, attendanceDate);
            }

            return res.status(200).json({
                success: true,
                message: 'Attendance updated successfully',
                attendance: existingAttendance,
            });
        }

        // Create new manual attendance record
        const attendance = new Attendance({
            studentId: student._id,
            rollNumber: student.rollNumber,
            date: attendanceDate,
            timestamp: new Date(),
            status,
            method: 'manual',
            remarks,
        });

        await attendance.save();

        // If they are marked absent, notify them
        if (status === 'absent') {
            await notificationService.sendAbsenceEmail(student.name, student.email, attendanceDate);
        }

        res.status(201).json({
            success: true,
            message: 'Attendance marked manually',
            attendance,
        });

    } catch (error) {
        console.error('Error marking manual attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking manual attendance',
            error: error.message,
        });
    }
};

/**
 * Mark all unmarked students as absent for today and notify them.
 * POST /api/attendance/notify-absentees
 */
exports.markAbsenteesAndNotify = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Get all active students
        const allStudents = await Student.find({ isActive: true });

        // 2. Get today's attendance records
        const todayAttendanceRecords = await Attendance.find({ date: today });
        const markedStudentIds = new Set(todayAttendanceRecords.map(a => a.studentId.toString()));

        // 3. Find missing students
        const absentStudents = allStudents.filter(student => !markedStudentIds.has(student._id.toString()));

        if (absentStudents.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'All students are already marked for today. No notifications sent.',
                count: 0
            });
        }

        // 4. Create absence records and notify
        let notificationCount = 0;
        const newRecords = [];

        for (const student of absentStudents) {
            // Create the absent record
            newRecords.push({
                studentId: student._id,
                rollNumber: student.rollNumber,
                date: today,
                timestamp: new Date(),
                status: 'absent',
                method: 'manual',
                remarks: 'Auto-marked absent'
            });

            // Attempt to notify
            if (student.email) {
                const sent = await notificationService.sendAbsenceEmail(student.name, student.email, today);
                if (sent) notificationCount++;
            }
        }

        // Bulk insert records for efficiency
        if (newRecords.length > 0) {
            await Attendance.insertMany(newRecords);
        }

        res.status(200).json({
            success: true,
            message: `Marked ${newRecords.length} students as absent and sent ${notificationCount} emails.`,
            recordsCreated: newRecords.length,
            notificationsSent: notificationCount
        });

    } catch (error) {
        console.error('Error in notify absentees:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking absentees and notifying',
            error: error.message,
        });
    }
};
