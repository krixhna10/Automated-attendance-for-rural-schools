# Automated Attendance System for Rural Schools

A complete web-based face recognition attendance system designed for low-bandwidth rural environments using free and open-source technologies.

![System Status](https://img.shields.io/badge/status-ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Features

- **Face Recognition**: Automatic attendance marking using AI-powered face recognition
- **Duplicate Prevention**: Students can only be marked present once per day
- **Real-time Tracking**: Live attendance statistics and reports
- **Low-Bandwidth Optimized**: Designed for rural internet connections
- **Teacher Dashboard**: Comprehensive reports with filters and CSV export
- **Free & Open Source**: Built entirely with free technologies

## 🏗️ System Architecture

```
Frontend (HTML/CSS/JS)
    ↓
face-api.js (Face Recognition)
    ↓
REST API (Node.js/Express)
    ↓
MongoDB Atlas (Database)
```

## 📁 Project Structure

```
attendance/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── Student.js            # Student schema
│   │   └── Attendance.js         # Attendance schema
│   ├── routes/
│   │   ├── students.js           # Student routes
│   │   └── attendance.js         # Attendance routes
│   ├── controllers/
│   │   ├── studentController.js  # Student logic
│   │   └── attendanceController.js # Attendance logic
│   ├── middleware/
│   │   └── errorHandler.js       # Error handling
│   ├── .env                      # Environment variables
│   ├── server.js                 # Entry point
│   └── package.json              # Dependencies
│
├── frontend/
│   ├── css/
│   │   └── styles.css            # Main stylesheet
│   ├── js/
│   │   ├── config.js             # API configuration
│   │   ├── faceRecognition.js    # Face detection/recognition
│   │   ├── register.js           # Registration logic
│   │   ├── attendance.js         # Attendance logic
│   │   └── dashboard.js          # Dashboard logic
│   ├── index.html                # Landing page
│   ├── register.html             # Student registration
│   ├── attendance.html           # Attendance capture
│   └── dashboard.html            # Teacher dashboard
│
└── docs/
    ├── ARCHITECTURE.md           # System architecture
    ├── API.md                    # API documentation
    └── DEPLOYMENT.md             # Deployment guide
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- MongoDB Atlas account (free tier)
- Modern web browser with camera access

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB Atlas connection string
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=*
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Verify server is running**
   - Open http://localhost:5000/health
   - You should see: `{"success": true, "message": "Server is running"}`

### Frontend Setup

The backend is configured to serve the frontend files automatically.

1. **Access the application**
   - Open your browser and navigate to: http://localhost:5000
   - Grant camera permissions when prompted

*Note: You can still run the frontend separately if desired, but running the backend server is sufficient for the full application.*

## 📖 Usage Guide

### 1. Register Students

1. Go to **Register** page
2. Fill in student details (Roll Number, Name, Class, Section)
3. Click "Start Camera"
4. Position student's face in camera view
5. Click "Capture Face" when face is detected
6. Click "Register Student"

### 2. Mark Attendance

1. Go to **Attendance** page
2. Click "Start Attendance"
3. Students face the camera one by one
4. System automatically recognizes and marks attendance
5. View real-time attendance list below

### 3. View Reports

1. Go to **Dashboard** page
2. View today's statistics (total, present, absent, rate)
3. Use filters to view specific dates, classes, or students
4. Click "Export CSV" to download reports

## 🗄️ Database Schema

### Students Collection

```javascript
{
  rollNumber: String (unique),
  name: String,
  class: String,
  section: String,
  faceDescriptor: [Number], // 128-dimensional array
  photo: String, // Base64 (optional)
  email: String,
  phone: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance Collection

```javascript
{
  studentId: ObjectId (ref: Student),
  rollNumber: String,
  date: Date, // Normalized to start of day
  timestamp: Date, // Exact time
  status: String (present/absent),
  confidence: Number, // 0-1
  method: String (face-recognition/manual),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Students

- `POST /api/students/register` - Register new student
- `GET /api/students` - Get all students
- `GET /api/students/:rollNumber` - Get student by roll number
- `GET /api/students/descriptors` - Get face descriptors
- `PUT /api/students/:rollNumber` - Update student
- `DELETE /api/students/:rollNumber` - Delete student

### Attendance

- `POST /api/attendance/mark` - Mark attendance
- `POST /api/attendance/manual` - Manual attendance
- `GET /api/attendance/report` - Get attendance report
- `GET /api/attendance/stats` - Get statistics
- `GET /api/attendance/student/:rollNumber` - Get student history

See [API.md](docs/API.md) for detailed documentation.

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- face-api.js (Face Recognition)
- MediaDevices API (Camera Access)

### Backend
- Node.js v18+
- Express.js
- Mongoose (MongoDB ODM)
- CORS, dotenv

### Database
- MongoDB Atlas (Free M0 Cluster)

## 🌐 Deployment

### Backend Deployment (Render/Railway)

1. Create account on [Render.com](https://render.com) or [Railway.app](https://railway.app)
2. Connect GitHub repository
3. Set environment variables:
   - `MONGODB_URI`
   - `PORT`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-frontend-url.com`
4. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Create account on [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
2. Connect GitHub repository
3. Set build settings:
   - Build command: (none)
   - Publish directory: `frontend`
4. Deploy

### MongoDB Atlas Setup

1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create M0 (free) cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string
6. Update backend `.env` file

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed guide.

## 🔒 Security Considerations

- Face descriptors are mathematical representations, not actual images
- Use HTTPS in production
- Implement authentication for production use
- Validate all inputs on backend
- Rate limit API endpoints
- Never commit `.env` file to version control

## 🐛 Troubleshooting

### Camera not working
- Grant camera permissions in browser
- Use HTTPS (required for camera access)
- Check if camera is being used by another application

### Face not detected
- Ensure good lighting
- Face the camera directly
- Remove glasses or face coverings
- Check if models are loaded correctly

### Cannot connect to backend
- Verify backend server is running
- Check `API_BASE_URL` in `frontend/js/config.js`
- Ensure CORS is configured correctly

### MongoDB connection error
- Verify `MONGODB_URI` in `.env`
- Check network connectivity
- Ensure IP is whitelisted in MongoDB Atlas

## 📝 License

MIT License - Free to use and modify

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📧 Support

For questions or issues, please create an issue on GitHub.

---

**Built with ❤️ for Rural Schools**
#   A u t o m a t e d - a t t e n d a n c e - f o r - r u r a l - s c h o o l s  
 