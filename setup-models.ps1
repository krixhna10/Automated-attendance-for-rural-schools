# Automated Attendance System - Quick Setup Script
# Run this script to download face-api.js models (vladmandic/face-api compatible)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Face-API.js Models Download Script  " -ForegroundColor Cyan
Write-Host "  (Source: vladmandic/face-api)       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
$currentPath = Get-Location
Write-Host "Current directory: $currentPath" -ForegroundColor Yellow

# Create models directory if it doesn't exist
$modelsPath = Join-Path $currentPath "frontend\models"
if (-not (Test-Path $modelsPath)) {
    Write-Host "Creating models directory..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $modelsPath -Force | Out-Null
}

Set-Location $modelsPath
Write-Host "Downloading models to: $modelsPath" -ForegroundColor Green
Write-Host ""

# Base URL for models (vladmandic repository)
$baseUrl = "https://raw.githubusercontent.com/vladmandic/face-api/master/model"

# Model files to download
$models = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model.bin",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model.bin",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model.bin"
)

# Download each model
$downloaded = 0
$failed = 0

foreach ($model in $models) {
    Write-Host "Downloading: $model..." -ForegroundColor Yellow
    
    try {
        $url = "$baseUrl/$model"
        $output = Join-Path $modelsPath $model
        
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        
        $fileSize = (Get-Item $output).Length / 1KB
        $fileSizeRounded = [math]::Round($fileSize, 2)
        Write-Host "  [OK] Downloaded successfully ($fileSizeRounded KB)" -ForegroundColor Green
        $downloaded++
    }
    catch {
        Write-Host "  [FAIL] Failed to download: $_" -ForegroundColor Red
        $failed++
    }
    
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Download Summary:" -ForegroundColor Cyan
Write-Host "  Downloaded: $downloaded files" -ForegroundColor Green
Write-Host "  Failed: $failed files" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($downloaded -eq $models.Count) {
    Write-Host "[SUCCESS] All models downloaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Restart backend server if running" -ForegroundColor White
    Write-Host "  2. Run migration tool to regenerate descriptors" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[WARNING] Some models failed to download. Please check your internet connection." -ForegroundColor Yellow
    Write-Host "You can manually download from: $baseUrl" -ForegroundColor White
    Write-Host ""
}

# Return to original directory
Set-Location $currentPath
