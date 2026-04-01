/**
 * Dashboard Page Logic
 * Handles attendance reports, statistics, and student management
 */

// DOM Elements
const totalStudentsEl = document.getElementById('totalStudents');
const presentTodayEl = document.getElementById('presentToday');
const absentTodayEl = document.getElementById('absentToday');
const attendanceRateEl = document.getElementById('attendanceRate');
const reportContainer = document.getElementById('reportContainer');
const studentListContainer = document.getElementById('studentListContainer');
const reportSubtitle = document.getElementById('reportSubtitle');

const filterDate = document.getElementById('filterDate');
const filterClass = document.getElementById('filterClass');
const filterSection = document.getElementById('filterSection');
const filterRollNumber = document.getElementById('filterRollNumber');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const exportBtn = document.getElementById('exportBtn');
const notifyAbsenteesBtn = document.getElementById('notifyAbsenteesBtn');

// State
let currentReport = [];

/**
 * Initialize dashboard
 */
async function init() {
  // Set default date to today
  filterDate.value = formatDate(new Date());

  // Load initial data
  await loadStats();
  await loadReport();
  await loadStudents();
}

/**
 * Load attendance statistics
 */
async function loadStats() {
  try {
    const date = filterDate.value || formatDate(new Date());
    const response = await fetch(`${API_ENDPOINTS.attendance.stats}?date=${date}`);
    const data = await response.json();

    if (data.success) {
      totalStudentsEl.textContent = data.stats.totalStudents;
      presentTodayEl.textContent = data.stats.presentToday;
      absentTodayEl.textContent = data.stats.absentToday;
      attendanceRateEl.textContent = data.stats.attendanceRate + '%';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
    showToast('Error loading statistics', 'error');
  }
}

/**
 * Load attendance report
 */
async function loadReport() {
  try {
    reportContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;

    // Build query parameters
    const params = new URLSearchParams();

    if (filterDate.value) {
      params.append('date', filterDate.value);
    }
    if (filterClass.value) {
      params.append('class', filterClass.value);
    }
    if (filterSection.value) {
      params.append('section', filterSection.value.toUpperCase());
    }
    if (filterRollNumber.value) {
      params.append('rollNumber', filterRollNumber.value.toUpperCase());
    }

    const response = await fetch(`${API_ENDPOINTS.attendance.report}?${params}`);
    const data = await response.json();

    if (data.success) {
      currentReport = data.report;
      displayReport(data.report);

      // Update subtitle
      const dateStr = filterDate.value
        ? new Date(filterDate.value).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'today';
      reportSubtitle.textContent = `Showing attendance for ${dateStr} (${data.count} records)`;
    }
  } catch (error) {
    console.error('Error loading report:', error);
    reportContainer.innerHTML = `
      <div class="alert alert-error">
        Error loading attendance report
      </div>
    `;
  }
}

/**
 * Display attendance report
 */
function displayReport(records) {
  if (records.length === 0) {
    reportContainer.innerHTML = `
      <div class="alert alert-info">
        No attendance records found for the selected filters
      </div>
    `;
    return;
  }

  const html = `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Name</th>
            <th>Class</th>
            <th>Section</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(record => `
            <tr>
              <td><strong>${record.rollNumber}</strong></td>
              <td>${record.name}</td>
              <td>${record.class}</td>
              <td>${record.section}</td>
              <td>${new Date(record.date).toLocaleDateString('en-IN')}</td>
              <td>${formatTimestamp(record.timestamp)}</td>
              <td>
                <span class="badge ${record.status === 'present' ? 'badge-success' : 'badge-error'}">
                  ${record.status === 'present' ? '✓ Present' : '✗ Absent'}
                </span>
              </td>
              <td>${(record.confidence * 100).toFixed(0)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  reportContainer.innerHTML = html;
}

/**
 * Load registered students
 */
async function loadStudents() {
  try {
    const response = await fetch(API_ENDPOINTS.students.getAll);
    const data = await response.json();

    if (data.success) {
      displayStudents(data.students);
    }
  } catch (error) {
    console.error('Error loading students:', error);
    studentListContainer.innerHTML = `
      <div class="alert alert-error">
        Error loading student list
      </div>
    `;
  }
}

/**
 * Display student list
 */
function displayStudents(students) {
  if (students.length === 0) {
    studentListContainer.innerHTML = `
      <div class="alert alert-info">
        No students registered yet. <a href="register.html">Register students</a>
      </div>
    `;
    return;
  }

  const html = `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Name</th>
            <th>Class</th>
            <th>Section</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td><strong>${student.rollNumber}</strong></td>
              <td>${student.name}</td>
              <td>${student.class}</td>
              <td>${student.section}</td>
              <td>${student.email || '-'}</td>
              <td>${student.phone || '-'}</td>
              <td>
                <span class="badge ${student.isActive ? 'badge-success' : 'badge-error'}">
                  ${student.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <p class="mt-md text-center" style="color: var(--text-muted);">
      Total: ${students.length} students
    </p>
  `;

  studentListContainer.innerHTML = html;
}

/**
 * Apply filters
 */
applyFiltersBtn.addEventListener('click', async () => {
  await loadStats();
  await loadReport();
});

/**
 * Clear filters
 */
clearFiltersBtn.addEventListener('click', async () => {
  filterDate.value = formatDate(new Date());
  filterClass.value = '';
  filterSection.value = '';
  filterRollNumber.value = '';

  await loadStats();
  await loadReport();
});

/**
 * Export to CSV
 */
exportBtn.addEventListener('click', () => {
  if (currentReport.length === 0) {
    showToast('No data to export', 'warning');
    return;
  }

  // Create CSV content
  const headers = ['Roll Number', 'Name', 'Class', 'Section', 'Date', 'Time', 'Status', 'Confidence'];
  const rows = currentReport.map(record => [
    record.rollNumber,
    record.name,
    record.class,
    record.section,
    new Date(record.date).toLocaleDateString('en-IN'),
    formatTimestamp(record.timestamp),
    record.status,
    (record.confidence * 100).toFixed(0) + '%',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `attendance_${formatDate(new Date())}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Report exported successfully', 'success');
});

/**
 * Enable Enter key to apply filters
 */
[filterDate, filterClass, filterSection, filterRollNumber].forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      applyFiltersBtn.click();
    }
  });
});

/**
 * Notify Absentees
 */
notifyAbsenteesBtn.addEventListener('click', async () => {
  try {
    const confirmNotify = confirm('Are you sure you want to mark all unmarked active students as absent for today and send them notifications?');
    if (!confirmNotify) return;

    // Ensure we define the endpoint if it's not in config
    const notifyUrl = API_ENDPOINTS.attendance.notifyAbsentees || `${API_BASE_URL}/attendance/notify-absentees`;

    const response = await fetch(notifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();

    if (data.success) {
      showToast(data.message, 'success');
      await loadStats();
      await loadReport();
    } else {
      showToast(data.message || 'Error notifying absentees', 'error');
    }
  } catch (error) {
    console.error('Error in notifying absentees:', error);
    showToast('Error notifying absentees. Check console for details.', 'error');
  }
});

// Initialize on page load
init();

// Auto-refresh every 30 seconds
setInterval(async () => {
  await loadStats();
  await loadReport();
}, 30000);
