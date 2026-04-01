/**
 * Student Registration Page Logic
 * Handles student registration with face capture
 */

// DOM Elements
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const statusText = document.getElementById('statusText');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureFaceBtn = document.getElementById('captureFaceBtn');
const retakeBtn = document.getElementById('retakeBtn');
const faceStatus = document.getElementById('faceStatus');
const photoPreview = document.getElementById('photoPreview');
const capturedPhoto = document.getElementById('capturedPhoto');
const loadingIndicator = document.getElementById('loadingIndicator');
const submitBtn = document.getElementById('submitBtn');
const registrationForm = document.getElementById('registrationForm');

// State variables
let stream = null;
let faceDescriptor = null;
let capturedPhotoData = null;
let detectionInterval = null;

/**
 * Initialize page
 */
async function init() {
    try {
        statusText.textContent = 'Loading face recognition models...';
        await loadFaceModels();
        statusText.textContent = 'Ready! Click "Start Camera" to begin.';
    } catch (error) {
        statusText.textContent = 'Error loading models';
        showToast(error.message, 'error');
    }
}

/**
 * Start camera and face detection
 */
startCameraBtn.addEventListener('click', async () => {
    try {
        startCameraBtn.disabled = true;
        statusText.textContent = 'Starting camera...';

        // Start video stream
        stream = await startVideo(video);

        // Set up canvas overlay
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;

        // Show capture button
        captureFaceBtn.classList.remove('hidden');
        startCameraBtn.classList.add('hidden');

        // Start face detection loop
        startFaceDetection();

        statusText.textContent = 'Position face in camera';

    } catch (error) {
        statusText.textContent = 'Camera error';
        showToast(error.message, 'error');
        startCameraBtn.disabled = false;
    }
});

/**
 * Start continuous face detection
 */
function startFaceDetection() {
    detectionInterval = setInterval(async () => {
        const detection = await detectSingleFace(video);

        // Clear previous drawings
        clearCanvas(overlay);

        if (detection) {
            // Draw face box
            drawFaceBox(overlay, detection, '');

            // Update status
            const confidence = (detection.confidence * 100).toFixed(0);
            statusText.textContent = `Face detected (${confidence}% confidence)`;
            statusText.style.color = 'var(--success-color)';

            faceStatus.innerHTML = `
        <div class="alert alert-success">
          ✅ Face detected! Click "Capture Face" to continue.
        </div>
      `;
            faceStatus.classList.remove('hidden');

            captureFaceBtn.disabled = false;

        } else {
            statusText.textContent = 'No face detected';
            statusText.style.color = 'var(--warning-color)';

            faceStatus.innerHTML = `
        <div class="alert alert-warning">
          ⚠️ No face detected. Please position your face in the camera.
        </div>
      `;
            faceStatus.classList.remove('hidden');

            captureFaceBtn.disabled = true;
        }
    }, 100); // Check every 100ms
}

/**
 * Stop face detection
 */
function stopFaceDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
}

/**
 * Capture face
 */
captureFaceBtn.addEventListener('click', async () => {
    try {
        captureFaceBtn.disabled = true;
        statusText.textContent = 'Capturing face...';

        // Detect face one more time
        const detection = await detectSingleFace(video);

        if (!detection) {
            showToast('No face detected. Please try again.', 'error');
            captureFaceBtn.disabled = false;
            return;
        }

        // Store face descriptor
        faceDescriptor = detection.descriptor;

        // Capture photo
        capturedPhotoData = capturePhoto(video);

        // Stop detection and video
        stopFaceDetection();
        stopVideo(video);

        // Show preview
        capturedPhoto.src = capturedPhotoData;
        photoPreview.classList.remove('hidden');

        // Hide camera controls
        captureFaceBtn.classList.add('hidden');
        retakeBtn.classList.remove('hidden');

        // Enable submit button
        submitBtn.disabled = false;

        statusText.textContent = 'Face captured successfully!';
        statusText.style.color = 'var(--success-color)';

        faceStatus.innerHTML = `
      <div class="alert alert-success">
        ✅ Face captured! You can now register the student.
      </div>
    `;

        showToast('Face captured successfully!', 'success');

    } catch (error) {
        showToast('Error capturing face: ' + error.message, 'error');
        captureFaceBtn.disabled = false;
    }
});

/**
 * Retake photo
 */
retakeBtn.addEventListener('click', async () => {
    // Reset state
    faceDescriptor = null;
    capturedPhotoData = null;

    // Hide preview
    photoPreview.classList.add('hidden');

    // Reset buttons
    retakeBtn.classList.add('hidden');
    startCameraBtn.classList.remove('hidden');
    submitBtn.disabled = true;

    // Clear canvas
    clearCanvas(overlay);

    statusText.textContent = 'Ready! Click "Start Camera" to begin.';
    statusText.style.color = 'var(--text-primary)';
    faceStatus.classList.add('hidden');
});

/**
 * Handle form submission
 */
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate face capture
    if (!faceDescriptor) {
        showToast('Please capture student face first', 'error');
        return;
    }

    // Get form data
    const formData = {
        rollNumber: document.getElementById('rollNumber').value.trim(),
        name: document.getElementById('name').value.trim(),
        class: document.getElementById('class').value.trim(),
        section: document.getElementById('section').value.trim().toUpperCase(),
        email: document.getElementById('email').value.trim() || null,
        phone: document.getElementById('phone').value.trim() || null,
        faceDescriptor: faceDescriptor,
        photo: capturedPhotoData,
    };

    // Validate required fields
    if (!formData.rollNumber || !formData.name || !formData.class || !formData.section) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        // Show loading
        loadingIndicator.classList.remove('hidden');
        registrationForm.classList.add('hidden');

        // Send registration request
        const response = await fetch(API_ENDPOINTS.students.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
            showToast('Student registered successfully!', 'success');

            // Show success message
            loadingIndicator.innerHTML = `
        <div class="alert alert-success">
          <h3>✅ Registration Successful!</h3>
          <p><strong>Roll Number:</strong> ${data.student.rollNumber}</p>
          <p><strong>Name:</strong> ${data.student.name}</p>
          <p><strong>Class:</strong> ${data.student.class}-${data.student.section}</p>
          <div class="mt-md">
            <a href="register.html" class="btn btn-primary">Register Another Student</a>
            <a href="dashboard.html" class="btn btn-secondary">View Dashboard</a>
          </div>
        </div>
      `;

        } else {
            throw new Error(data.message || 'Registration failed');
        }

    } catch (error) {
        showToast('Error: ' + error.message, 'error');

        // Show form again
        loadingIndicator.classList.add('hidden');
        registrationForm.classList.remove('hidden');
    }
});

// Initialize on page load
init();
