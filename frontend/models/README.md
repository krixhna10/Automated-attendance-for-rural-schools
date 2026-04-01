# Face-API.js Models

This directory should contain the face-api.js model files required for face detection and recognition.

## Required Models

Download the following model files from the [face-api.js repository](https://github.com/vladmandic/face-api/tree/master/model):

### Tiny Face Detector
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`

### Face Landmark 68
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`

### Face Recognition
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`

## How to Download

### Option 1: Manual Download

1. Visit https://github.com/vladmandic/face-api/tree/master/model
2. Download each file listed above
3. Place all files in this `models/` directory

### Option 2: Using wget (Linux/Mac)

```bash
cd frontend/models

# Tiny Face Detector
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-shard1

# Face Landmark 68
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-shard1

# Face Recognition
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-weights_manifest.json
wget https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-shard1
```

### Option 3: Using PowerShell (Windows)

```powershell
cd frontend\models

# Tiny Face Detector
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_manifest.json" -OutFile "tiny_face_detector_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-shard1" -OutFile "tiny_face_detector_model-shard1"

# Face Landmark 68
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_manifest.json" -OutFile "face_landmark_68_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-shard1" -OutFile "face_landmark_68_model-shard1"

# Face Recognition
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-weights_manifest.json" -OutFile "face_recognition_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-shard1" -OutFile "face_recognition_model-shard1"
```

## Verification

After downloading, this directory should contain 6 files:

```
models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1
├── face_recognition_model-weights_manifest.json
└── face_recognition_model-shard1
```

## File Sizes (Approximate)

- `tiny_face_detector_model-shard1`: ~400 KB
- `face_landmark_68_model-shard1`: ~350 KB
- `face_recognition_model-shard1`: ~6.2 MB

**Total**: ~7 MB

## Troubleshooting

### Models not loading

1. Check browser console for errors
2. Verify all 6 files are present
3. Ensure file names match exactly (case-sensitive)
4. Check file sizes match expected values
5. Try re-downloading corrupted files

### CORS errors

If loading models from a different domain, ensure CORS headers are set correctly.

---

**Note**: These model files are required for the face recognition system to work. The application will not function without them.
