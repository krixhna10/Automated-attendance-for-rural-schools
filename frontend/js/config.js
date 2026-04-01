/**
 * API Configuration
 * Central configuration for backend API endpoints
 */

// Backend API base URL
// Change this to your deployed backend URL in production
const API_BASE_URL = 'http://localhost:5000/api';

// API endpoints
const API_ENDPOINTS = {
    // Student endpoints
    students: {
        register: `${API_BASE_URL}/students/register`,
        getAll: `${API_BASE_URL}/students`,
        getByRollNumber: (rollNumber) => `${API_BASE_URL}/students/${rollNumber}`,
        getDescriptors: `${API_BASE_URL}/students/descriptors`,
        update: (rollNumber) => `${API_BASE_URL}/students/${rollNumber}`,
        delete: (rollNumber) => `${API_BASE_URL}/students/${rollNumber}`,
    },

    // Attendance endpoints
    attendance: {
        mark: `${API_BASE_URL}/attendance/mark`,
        manual: `${API_BASE_URL}/attendance/manual`,
        report: `${API_BASE_URL}/attendance/report`,
        stats: `${API_BASE_URL}/attendance/stats`,
        studentHistory: (rollNumber) => `${API_BASE_URL}/attendance/student/${rollNumber}`,
    },

    // Health check
    health: 'http://localhost:5000/health',
};

// Face recognition configuration
const FACE_CONFIG = {
    // Minimum confidence score for face detection (0-1)
    minDetectionConfidence: 0.5,

    // TinyFaceDetector input size (must be divisible by 32)
    // Common values: 320, 416 (default), 512, 608
    // Higher = detecting smaller faces, slower. Lower = faster, less accurate.
    detectorInputSize: 512,

    // Maximum distance for face matching (lower = stricter)
    // Typical values: 0.4-0.6 (0.6 is recommended for balance)
    maxMatchDistance: 0.45,

    // Video constraints for camera
    videoConstraints: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user', // Use front camera
    },

    // Model paths (relative to frontend root)
    modelPath: './models',
};

// UI Configuration
const UI_CONFIG = {
    // Toast notification duration (ms)
    toastDuration: 3000,

    // Loading spinner delay (ms)
    loadingDelay: 500,

    // Auto-refresh interval for dashboard (ms)
    dashboardRefreshInterval: 30000, // 30 seconds
};
