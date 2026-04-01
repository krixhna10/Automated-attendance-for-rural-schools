/**
 * Migration Script
 * Regenerates face descriptors for all students using new models
 */

const startBtn = document.getElementById('startBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const logContainer = document.getElementById('logContainer');
const progressContainer = document.getElementById('progressContainer');

// Logger
function log(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    entry.style.color = type === 'error' ? 'var(--error-color)' : type === 'success' ? 'var(--success-color)' : 'inherit';

    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Start migration
startBtn.addEventListener('click', async () => {
    try {
        startBtn.disabled = true;
        progressContainer.classList.remove('hidden');
        log('Starting migration process...', 'info');

        // 1. Load models
        log('Loading face recognition models...', 'info');
        await loadFaceModels();
        log('Models loaded successfully', 'success');

        // 2. Fetch all students
        log('Fetching student list...', 'info');
        const response = await fetch(API_ENDPOINTS.students.getAll);
        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to fetch students');
        }

        const students = data.students;
        const total = students.length;
        log(`Found ${total} students to process`, 'info');

        // 3. Process each student
        let processed = 0;
        let success = 0;
        let failed = 0;

        for (const student of students) {
            try {
                if (!student.photo) {
                    log(`Skipping ${student.rollNumber}: No photo available`, 'warning');
                    failed++;
                    continue;
                }

                log(`Processing ${student.rollNumber} (${student.name})...`, 'info');

                // Create image element from base64 photo
                const img = await new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = reject;
                    image.src = student.photo;
                });

                // Detect face
                const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!detection) {
                    log(`Failed to detect face for ${student.rollNumber}`, 'error');
                    failed++;
                    continue;
                }

                // Update student with new descriptor
                const descriptor = Array.from(detection.descriptor);

                // We need a specific endpoint to update ONLY the descriptor, 
                // but for now we can rely on the update endpoint if we send expected data.
                // ideally backend should allow patching descriptor.

                // Reuse register endpoint? No. Update endpoint.
                // But update endpoint might validate other fields.
                // Let's try update endpoint.

                const updateResponse = await fetch(`${API_BASE_URL}/students/${student.rollNumber}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        faceDescriptor: descriptor
                    })
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to update backend');
                }

                log(`Updated ${student.rollNumber}`, 'success');
                success++;

            } catch (err) {
                log(`Error processing ${student.rollNumber}: ${err.message}`, 'error');
                failed++;
            } finally {
                processed++;
                const percent = Math.round((processed / total) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${percent}% complete (${processed}/${total})`;
            }
        }

        log('===================================', 'info');
        log(`Migration completed. Success: ${success}, Failed: ${failed}`, success === total ? 'success' : 'warning');

        if (failed > 0) {
            alert(`Migration completed with ${failed} errors. Check log for details.`);
        } else {
            alert('Migration completed successfully!');
        }

    } catch (error) {
        log(`Critical error: ${error.message}`, 'error');
        alert('Migration failed: ' + error.message);
    } finally {
        startBtn.disabled = false;
    }
});
