/**
 * Student Report Logic
 * Handles searching and displaying student attendance history
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('searchForm');
    const rollNumberInput = document.getElementById('rollNumberInput');
    const searchBtn = document.getElementById('searchBtn');
    const btnText = searchBtn.querySelector('.btn-text');

    // UI State elements
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsSection = document.getElementById('resultsSection');

    // Data elements
    const studentName = document.getElementById('studentName');
    const studentDetails = document.getElementById('studentDetails');
    const totalDays = document.getElementById('totalDays');
    const presentDays = document.getElementById('presentDays');
    const absentDays = document.getElementById('absentDays');
    const attendanceRate = document.getElementById('attendanceRate');
    const historyTableBody = document.getElementById('historyTableBody');
    const emptyHistory = document.getElementById('emptyHistory');

    // Event Listener for the Form
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const rollNumber = rollNumberInput.value.trim().toUpperCase();
        if (!rollNumber) {
            showError('Please enter a valid Roll Number.');
            return;
        }

        // Reset UI State
        hideError();
        hideResults();
        showLoading(true);

        try {
            // Fetch student history from backend
            const response = await fetch(API_ENDPOINTS.attendance.studentHistory(rollNumber));
            const data = await response.json();

            if (data.success) {
                renderResults(data);
                showResults();
            } else {
                showError(data.message || 'Error fetching attendance data.');
            }
        } catch (error) {
            console.error('Error:', error);
            // If the backend returns 404, the default fetch might throw or just return error JSON. 
            // We handled JSON above, but if network fails:
            showError('Failed to connect to the server. Please ensure the backend is running.');
        } finally {
            showLoading(false);
        }
    });

    /**
     * Updates the DOM with the fetched student data
     */
    function renderResults(data) {
        const { student, statistics, attendance } = data;

        // Populate student info
        studentName.textContent = student.name;
        studentDetails.textContent = `Roll No: ${student.rollNumber} • Class: ${student.class} • Section: ${student.section}`;

        // Populate statistics
        totalDays.textContent = statistics.totalDays;
        presentDays.textContent = statistics.presentDays;
        absentDays.textContent = statistics.absentDays;

        // Color code attendance rate based on threshold (e.g., < 75% is red)
        attendanceRate.textContent = `${statistics.attendanceRate}%`;
        if (statistics.attendanceRate >= 75) {
            attendanceRate.style.color = 'var(--success-color)';
        } else if (statistics.attendanceRate >= 50) {
            attendanceRate.style.color = '#d97706'; // warning/orange color
        } else {
            attendanceRate.style.color = 'var(--error-color)';
        }

        // Populate history table
        historyTableBody.innerHTML = '';

        if (attendance && attendance.length > 0) {
            emptyHistory.style.display = 'none';

            attendance.forEach(record => {
                const tr = document.createElement('tr');

                // Format dates
                const recordDate = new Date(record.date).toLocaleDateString('en-US', {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                });
                const recordTime = new Date(record.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit'
                });

                // Status Badge
                const statusClass = record.status === 'present' ? 'status-present' : 'status-absent';
                const statusText = record.status.charAt(0).toUpperCase() + record.status.slice(1);
                const statusHtml = `<span class="status-badge ${statusClass}">${statusText}</span>`;

                // Method Text
                const methodText = record.method === 'face-recognition' ? 'Face Recognition' : 'Manual Entry';

                tr.innerHTML = `
                    <td>${recordDate}</td>
                    <td>${statusHtml}</td>
                    <td class="text-secondary" style="font-size: 0.875rem;">${methodText}</td>
                    <td class="text-secondary" style="font-size: 0.875rem;">${recordTime}</td>
                `;

                historyTableBody.appendChild(tr);
            });
        } else {
            emptyHistory.style.display = 'block';
        }
    }

    // UI Helper Functions
    function showLoading(isLoading) {
        if (isLoading) {
            loadingIndicator.style.display = 'block';
            searchBtn.disabled = true;
            btnText.textContent = 'Searching...';
        } else {
            loadingIndicator.style.display = 'none';
            searchBtn.disabled = false;
            btnText.textContent = 'Search';
        }
    }

    function showResults() {
        resultsSection.style.display = 'block';
        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function hideResults() {
        resultsSection.style.display = 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }
});
