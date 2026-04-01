/**
 * Face Recognition Utilities
 * Handles face detection and recognition using face-api.js
 */

// Global variables
let modelsLoaded = false;
let labeledDescriptors = [];

/**
 * Load face-api.js models
 * Models are loaded from the /models directory
 */
async function loadFaceModels() {
    if (modelsLoaded) {
        console.log('✅ Models already loaded');
        return true;
    }

    try {
        console.log('📦 Loading face-api.js models...');

        const MODEL_URL = FACE_CONFIG.modelPath;

        // Load required models
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        modelsLoaded = true;
        console.log('✅ Face models loaded successfully');
        return true;

    } catch (error) {
        console.error('❌ Error loading face models:', error);
        throw new Error('Failed to load face recognition models. Please check model files.');
    }
}

/**
 * Start webcam video stream
 * @param {HTMLVideoElement} videoElement - Video element to stream to
 * @returns {Promise<MediaStream>} Video stream
 */
async function startVideo(videoElement) {
    // Try ideal constraints first, then fallback to default
    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: FACE_CONFIG.videoConstraints,
            audio: false,
        });
    } catch (err) {
        console.warn('⚠️ Failed to get camera with ideal constraints, trying defaults...', err);
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (finalErr) {
            console.error('❌ Error accessing camera:', finalErr);
            alert('Camera Error: Access denied or camera in use. Please check permissions and close other apps.');
            throw new Error('Cannot access camera: ' + finalErr.message);
        }
    }

    videoElement.srcObject = stream;

    return new Promise((resolve, reject) => {
        // Timeout if camera doesn't start in 30 seconds (give user time to click Allow)
        const timeoutId = setTimeout(() => {
            reject(new Error('Camera start timed out. Did you allow permissions?'));
        }, 30000);

        videoElement.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            videoElement.play()
                .then(() => resolve(stream))
                .catch(e => reject(new Error('Video play failed: ' + e.message)));
        };
    });
}

/**
 * Stop webcam video stream
 * @param {HTMLVideoElement} videoElement - Video element
 */
function stopVideo(videoElement) {
    const stream = videoElement.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
}

/**
 * Detect single face in video frame
 * @param {HTMLVideoElement} videoElement - Video element
 * @returns {Promise<Object>} Detection result with descriptor
 */
async function detectSingleFace(videoElement) {
    try {
        // Detect face with landmarks and descriptor
        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: FACE_CONFIG.detectorInputSize,
            scoreThreshold: FACE_CONFIG.minDetectionConfidence
        });

        const detection = await faceapi
            .detectSingleFace(videoElement, options)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return null;
        }

        // Check detection confidence
        if (detection.detection.score < FACE_CONFIG.minDetectionConfidence) {
            return null;
        }

        return {
            descriptor: Array.from(detection.descriptor), // Convert Float32Array to regular array
            landmarks: detection.landmarks,
            box: detection.detection.box,
            confidence: detection.detection.score,
        };

    } catch (error) {
        console.error('❌ Error detecting face:', error);
        return null;
    }
}

/**
 * Detect all faces in video frame
 * @param {HTMLVideoElement} videoElement - Video element
 * @returns {Promise<Array>} Array of detections
 */
async function detectAllFaces(videoElement) {
    try {
        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: FACE_CONFIG.detectorInputSize,
            scoreThreshold: FACE_CONFIG.minDetectionConfidence
        });

        const detections = await faceapi
            .detectAllFaces(videoElement, options)
            .withFaceLandmarks()
            .withFaceDescriptors();

        return detections.filter(d => d.detection.score >= FACE_CONFIG.minDetectionConfidence);

    } catch (error) {
        console.error('❌ Error detecting faces:', error);
        return [];
    }
}

/**
 * Load labeled face descriptors from backend
 * @returns {Promise<Array>} Array of labeled descriptors
 */
async function loadLabeledDescriptors() {
    try {
        console.log('📥 Loading student face descriptors...');

        const response = await fetch(API_ENDPOINTS.students.getDescriptors);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load descriptors');
        }

        // Convert to face-api.js LabeledFaceDescriptors format
        labeledDescriptors = data.descriptors.map(student => {
            const descriptorArray = new Float32Array(student.descriptor);
            return new faceapi.LabeledFaceDescriptors(
                student.rollNumber,
                [descriptorArray]
            );
        });

        console.log(`✅ Loaded ${labeledDescriptors.length} student descriptors`);
        return labeledDescriptors;

    } catch (error) {
        console.error('❌ Error loading descriptors:', error);
        throw error;
    }
}

/**
 * Find best match for a face descriptor
 * @param {Array} descriptor - Face descriptor to match
 * @returns {Object|null} Match result with rollNumber and distance
 */
function findBestMatch(descriptor) {
    if (labeledDescriptors.length === 0) {
        console.warn('⚠️ No labeled descriptors loaded');
        return null;
    }

    // Create face matcher
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, FACE_CONFIG.maxMatchDistance);

    // Find best match
    const descriptorArray = new Float32Array(descriptor);
    const bestMatch = faceMatcher.findBestMatch(descriptorArray);

    // Check if match is valid (not "unknown")
    if (bestMatch.label === 'unknown') {
        return null;
    }

    return {
        rollNumber: bestMatch.label,
        distance: bestMatch.distance,
        confidence: 1 - bestMatch.distance, // Convert distance to confidence (0-1)
    };
}

/**
 * Capture photo from video element
 * @param {HTMLVideoElement} videoElement - Video element
 * @returns {String} Base64 encoded image
 */
function capturePhoto(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');

    // Flip horizontally to match mirror view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(videoElement, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8); // 80% quality for smaller size
}

/**
 * Draw face detection box on canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} detection - Detection result
 * @param {String} label - Label to display
 */
function drawFaceBox(canvas, detection, label = '') {
    const ctx = canvas.getContext('2d');
    const { x, y, width, height } = detection.box;

    // Mirror the x coordinate
    const mirroredX = canvas.width - x - width;

    // Draw box
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.strokeRect(mirroredX, y, width, height);

    // Draw label background
    if (label) {
        ctx.fillStyle = '#4f46e5';
        ctx.fillRect(mirroredX, y - 30, width, 30);

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, mirroredX + width / 2, y - 8);
    }
}

/**
 * Clear canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
function clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Show toast notification
 * @param {String} message - Message to display
 * @param {String} type - Type: success, error, warning, info
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast alert alert-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, UI_CONFIG.toastDuration);
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {String} Formatted date
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format timestamp to readable string
 * @param {String|Date} timestamp - Timestamp
 * @returns {String} Formatted timestamp
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
