/**
 * Attendance Marking Page Logic (Optimized)
 * Handles automatic face recognition and attendance marking
 */

// Debug: Check if script runs
console.log('📜 attendance.js loaded');

// Global state
let stream = null;
let isRecognizing = false;
// labeledDescriptors is already declared in faceRecognition.js
let markedStudents = new Set();
let lastRecognitionTime = 0; // Throttling
const RECOGNITION_INTERVAL = 500; // Run recognition every 500ms (2 FPS) - Balance speed/load
let detectorOptions = null;

// DOM Elements
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const statusText = document.getElementById('statusText');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const recognitionStatus = document.getElementById('recognitionStatus');
const attendanceList = document.getElementById('attendanceList');
const totalStudentsEl = document.getElementById('totalStudents');
const presentCountEl = document.getElementById('presentCount');
const attendanceRateEl = document.getElementById('attendanceRate');

if (!startBtn) {
  console.error('❌ Critical: startBtn not found in DOM');
  alert('Error: Start button not found. Please refresh.');
} else {
  console.log('✅ startBtn found');
}

/**
 * Initialize page
 */
async function init() {
  console.log('🚀 Initializing attendance system...');
  try {
    statusText.textContent = 'Initializing...';

    // 1. Load models
    console.log('📦 Loading models...');
    await loadFaceModels();
    console.log('✅ Models loaded');

    // 2. Load stats & attendance
    await Promise.all([
      loadTodayStats(),
      loadTodayAttendance()
    ]);

    // 3. Prepare detector options once using global config
    detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: FACE_CONFIG.detectorInputSize,
      scoreThreshold: FACE_CONFIG.minDetectionConfidence
    });

    statusText.textContent = 'Ready! Click "Start Attendance" to begin.';
    startBtn.disabled = false;

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    statusText.textContent = 'Error: ' + error.message;
    showToast('Initialization failed: ' + error.message, 'error');
  }
}

/**
 * Start Attendance Flow
 */
startBtn.addEventListener('click', async () => {
  try {
    startBtn.disabled = true;
    statusText.textContent = 'Loading student data...';

    // Load descriptors
    statusText.textContent = 'Loading student data...';
    console.log('📥 Loading descriptors...');
    labeledDescriptors = await loadLabeledDescriptors();

    if (labeledDescriptors.length === 0) {
      statusText.textContent = 'No students found.';
      showToast('No students registered! Please register students first.', 'warning');
      startBtn.disabled = false;
      return;
    }
    console.log(`✅ Loaded ${labeledDescriptors.length} descriptors`);

    // Start Camera
    statusText.textContent = 'Requesting camera access...';
    console.log('📸 Requesting camera...');
    stream = await startVideo(video);
    console.log('✅ Camera stream active');

    // Setup UI
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    // Start Loop
    statusText.textContent = 'Scanning...';
    isRecognizing = true;
    detectFacesLoop();

  } catch (error) {
    console.error('❌ Start failed:', error);
    alert('Failed to start: ' + error.message);
    startBtn.disabled = false;
    stopVideo(video);
  }
});

/**
 * Stop Attendance Flow
 */
stopBtn.addEventListener('click', () => {
  isRecognizing = false;
  stopVideo(video);
  stopBtn.classList.add('hidden');
  startBtn.classList.remove('hidden');
  startBtn.disabled = false;
  statusText.textContent = 'Stopped. Click "Start Attendance" to resume.';
  clearCanvas(overlay);
});

/**
 * Optimized Recognition Loop
 * Uses requestAnimationFrame for smooth UI, but throttles recognition
 */
async function detectFacesLoop() {
  if (!isRecognizing || !video.srcObject) return;

  const now = Date.now();

  // 1. Detection (Fast) - Run every frame for UI responsiveness
  // However, faceapi detection is async and heavy. We shouldn't stack calls.
  // We will use a simple "isBusy" flag or just await.

  try {
    // Detect all faces
    const detections = await faceapi.detectAllFaces(video, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Resize results to match video size
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(overlay, displaySize);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // Clear canvas
    clearCanvas(overlay);

    // Draw boxes
    faceapi.draw.drawDetections(overlay, resizedDetections);

    // Only process if we have detections

    // Match faces
    if (labeledDescriptors.length > 0) {
      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, FACE_CONFIG.maxMatchDistance);

      resizedDetections.forEach(d => {
        const bestMatch = faceMatcher.findBestMatch(d.descriptor);
        const box = d.detection.box;
        const label = bestMatch.toString();

        // Draw label
        const drawBox = new faceapi.draw.DrawBox(box, { label: label });
        drawBox.draw(overlay);

        // Auto-mark attendance if known and high confidence (low distance)
        if (bestMatch.label !== 'unknown' && bestMatch.distance < FACE_CONFIG.maxMatchDistance) {
          markAttendanceDebounced(bestMatch.label);
        }
      });
    }

  } catch (error) {
    console.warn('Detection error:', error);
  }

  // Loop
  if (isRecognizing) {
    requestAnimationFrame(detectFacesLoop);
  }
}

// Debounce marking to avoid spamming API
const pendingMarks = new Set();

async function markAttendanceDebounced(rollNumber) {
  if (markedStudents.has(rollNumber)) return; // Already marked today
  if (pendingMarks.has(rollNumber)) return; // API call in progress

  pendingMarks.add(rollNumber);

  try {
    console.log(`✅ Recognizing ${rollNumber}...`);
    showToast(`Recognized: ${rollNumber}`, 'info');

    const response = await fetch(API_ENDPOINTS.attendance.mark, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rollNumber: rollNumber,
        confidence: 0.9, // We trust our local matcher
        timestamp: new Date().toISOString()
      }) // Wait for backend to confirm
    });

    const data = await response.json();

    if (data.success) {
      markedStudents.add(rollNumber);
      showToast(`Marked Present: ${data.attendance.studentId.name}`, 'success');
      loadTodayStats();
      loadTodayAttendance();
    } else {
      // If already marked today according to backend
      if (data.message && data.message.includes('already marked')) {
        markedStudents.add(rollNumber);
      }
    }

  } catch (error) {
    console.error('Marking error:', error);
  } finally {
    pendingMarks.delete(rollNumber); // Allow retry if failed, or just cleanup
  }
}

// Helper: Load Stats
async function loadTodayStats() {
  try {
    const res = await fetch(API_ENDPOINTS.attendance.stats);
    const data = await res.json();
    if (data.success) {
      totalStudentsEl.textContent = data.stats.totalStudents;
      presentCountEl.textContent = data.stats.presentToday;
      attendanceRateEl.textContent = `${data.stats.attendanceRate}%`;
    }
  } catch (e) { console.error('Stats error:', e); }
}

// Helper: Load List
async function loadTodayAttendance() {
  try {
    // Simple date formatter
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const res = await fetch(`${API_ENDPOINTS.attendance.report}?date=${dateStr}`);
    const data = await res.json();

    if (data.success) {
      const list = data.report;
      markedStudents.clear();
      list.forEach(r => markedStudents.add(r.rollNumber));

      attendanceList.innerHTML = list.length ? list.map(record => `
                <div class="attendance-item">
                    <div class="info">
                        <span class="roll">${record.rollNumber}</span>
                        <span class="name">${record.studentId ? record.studentId.name : 'Unknown Student'}</span>
                    </div>
                    <div class="time">${new Date(record.timestamp).toLocaleTimeString()}</div>
                </div>
            `).join('') : '<div class="alert alert-info">No attendance marked yet.</div>';
    }
  } catch (e) {
    console.error('List error:', e);
    attendanceList.innerHTML = '<div class="alert alert-error">Failed to load list</div>';
  }
}

// Placeholder for missing faceRecognition.js helpers if needed, 
// but we reuse loadFaceModels/loadLabeledDescriptors/startVideo/stopVideo 
// assuming they are global.

init();
