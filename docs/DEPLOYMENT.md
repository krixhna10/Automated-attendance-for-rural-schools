# Deployment Guide

Complete guide to deploying the Automated Attendance System to free hosting platforms.

## Prerequisites

- GitHub account
- MongoDB Atlas account
- Vercel/Netlify account (frontend)
- Render/Railway account (backend)

## Step 1: MongoDB Atlas Setup

### 1.1 Create Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Start Free"
3. Sign up with email or Google

### 1.2 Create Cluster

1. Click "Build a Database"
2. Select "M0 Free" tier
3. Choose cloud provider (AWS recommended)
4. Select region closest to your users
5. Name your cluster (e.g., "attendance-cluster")
6. Click "Create"

### 1.3 Configure Database Access

1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and strong password
5. Set permissions to "Read and write to any database"
6. Click "Add User"

### 1.4 Configure Network Access

1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

> ⚠️ **Security Note**: For production, whitelist specific IPs instead of allowing all.

### 1.5 Get Connection String

1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `attendance`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/attendance?retryWrites=true&w=majority
```

## Step 2: Backend Deployment (Render)

### 2.1 Prepare Repository

1. Create GitHub repository
2. Push your code to GitHub
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/attendance-system.git
   git push -u origin main
   ```

### 2.2 Create Render Account

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub

### 2.3 Deploy Backend

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure service:
   - **Name**: `attendance-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. Add Environment Variables:
   - Click "Advanced"
   - Add environment variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     PORT=5000
     NODE_ENV=production
     CORS_ORIGIN=*
     ```

5. Click "Create Web Service"

6. Wait for deployment (5-10 minutes)

7. Copy your backend URL (e.g., `https://attendance-backend.onrender.com`)

### 2.4 Test Backend

1. Open `https://your-backend-url.onrender.com/health`
2. You should see: `{"success": true, "message": "Server is running"}`

## Step 3: Frontend Deployment (Vercel)

### 3.1 Download face-api.js Models

1. Create `frontend/models` directory
2. Download models from [face-api GitHub](https://github.com/vladmandic/face-api/tree/master/model)
3. Required files:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`

### 3.2 Update API Configuration

1. Edit `frontend/js/config.js`
2. Update `API_BASE_URL`:
   ```javascript
   const API_BASE_URL = 'https://your-backend-url.onrender.com/api';
   ```

3. Commit changes:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push
   ```

### 3.3 Create Vercel Account

1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub

### 3.4 Deploy Frontend

1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

4. Click "Deploy"

5. Wait for deployment (2-3 minutes)

6. Copy your frontend URL (e.g., `https://attendance-system.vercel.app`)

### 3.5 Update CORS

1. Go back to Render dashboard
2. Open your backend service
3. Go to "Environment"
4. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```
5. Save changes (service will redeploy)

## Step 4: Testing Deployment

### 4.1 Test Frontend

1. Open your Vercel URL
2. Check server status on home page
3. Should show "Server is running"

### 4.2 Test Registration

1. Go to Register page
2. Fill in student details
3. Grant camera permissions
4. Capture face and register
5. Check for success message

### 4.3 Test Attendance

1. Go to Attendance page
2. Start attendance
3. Face the camera
4. Verify recognition and marking

### 4.4 Test Dashboard

1. Go to Dashboard
2. Check statistics
3. View attendance report
4. Test filters and export

## Alternative Platforms

### Backend: Railway

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables
6. Deploy

### Frontend: Netlify

1. Go to [Netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: (leave empty)
   - **Publish directory**: `.`
6. Deploy

## Custom Domain (Optional)

### For Vercel

1. Go to project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### For Render

1. Go to service settings
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records

## Environment Variables Reference

### Backend (.env)

```bash
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance
PORT=5000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend-url.com

# Optional
LOG_LEVEL=info
```

### Frontend (config.js)

```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

## Monitoring & Maintenance

### Render

- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free (enough for 1 service)

### Vercel

- Unlimited bandwidth
- 100 GB-hours/month
- Automatic HTTPS
- Global CDN

### MongoDB Atlas

- 512 MB storage (M0 free tier)
- Shared RAM and vCPU
- Automatic backups (paid feature)

## Troubleshooting

### Backend not responding

1. Check Render logs
2. Verify environment variables
3. Test MongoDB connection
4. Check if service is sleeping

### Frontend can't connect to backend

1. Verify API_BASE_URL in config.js
2. Check CORS_ORIGIN on backend
3. Ensure backend is deployed and running
4. Check browser console for errors

### Camera not working

1. Ensure HTTPS is enabled (required for camera)
2. Grant camera permissions
3. Check if models are loaded
4. Try different browser

### Face recognition not working

1. Verify models are in `frontend/models/`
2. Check model file names
3. Ensure good lighting
4. Try with different face

## Performance Optimization

### Backend

1. Enable compression:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. Add caching headers:
   ```javascript
   app.use((req, res, next) => {
     res.set('Cache-Control', 'public, max-age=300');
     next();
   });
   ```

### Frontend

1. Minify CSS/JS (production build)
2. Compress images
3. Use CDN for libraries
4. Enable browser caching

## Security Best Practices

1. **Use HTTPS**: Automatic on Vercel/Render
2. **Environment Variables**: Never commit .env
3. **Input Validation**: Validate on backend
4. **Rate Limiting**: Add express-rate-limit
5. **Authentication**: Implement JWT (future)

## Backup Strategy

### Database

1. MongoDB Atlas automatic backups (paid)
2. Manual export:
   ```bash
   mongodump --uri="mongodb+srv://..."
   ```

### Code

1. GitHub repository (version control)
2. Regular commits
3. Tag releases

## Cost Estimate

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| MongoDB Atlas | 512 MB | $9/month (2 GB) |
| Render | 750 hrs/month | $7/month (always on) |
| Vercel | Unlimited | $20/month (team) |
| **Total** | **$0/month** | **$36/month** |

## Scaling Considerations

### When to upgrade

- More than 500 students
- High concurrent usage
- Need faster response times
- Require 24/7 uptime

### Upgrade path

1. **Database**: M10 cluster ($9/month)
2. **Backend**: Paid Render instance ($7/month)
3. **Frontend**: Vercel Pro ($20/month)

---

**Congratulations!** Your attendance system is now deployed and accessible worldwide. 🎉
