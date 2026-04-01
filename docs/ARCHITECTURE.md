# System Architecture

## Overview

The Automated Attendance System is built using a three-tier architecture:

1. **Presentation Layer** (Frontend)
2. **Application Layer** (Backend API)
3. **Data Layer** (MongoDB Database)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Client-Side)                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Register   │  │  Attendance  │  │  Dashboard   │      │
│  │     Page     │  │     Page     │  │     Page     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  face-api.js    │                        │
│                  │ (Face Detection │                        │
│                  │  & Recognition) │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │   Camera API    │                        │
│                  │ (MediaDevices)  │                        │
│                  └─────────────────┘                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    HTTP/REST API
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   BACKEND (Server-Side)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Express.js Server                   │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                               │
│         ┌───────────────────┼───────────────────┐           │
│         │                   │                   │           │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐    │
│  │   Student   │    │ Attendance  │    │    Error    │    │
│  │   Routes    │    │   Routes    │    │  Handling   │    │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘    │
│         │                  │                               │
│  ┌──────▼──────┐    ┌──────▼──────┐                       │
│  │   Student   │    │ Attendance  │                       │
│  │ Controller  │    │ Controller  │                       │
│  └──────┬──────┘    └──────┬──────┘                       │
│         │                  │                               │
│         └──────────┬───────┘                               │
│                    │                                       │
│            ┌───────▼────────┐                              │
│            │    Mongoose     │                              │
│            │  (MongoDB ODM)  │                              │
│            └───────┬─────────┘                              │
└────────────────────┼──────────────────────────────────────┘
                     │
                     │ MongoDB Protocol
                     │
┌────────────────────▼──────────────────────────────────────┐
│                  DATA LAYER                                │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │            MongoDB Atlas (Cloud)                 │     │
│  │                                                  │     │
│  │  ┌────────────────┐      ┌────────────────┐     │     │
│  │  │    Students    │      │   Attendance   │     │     │
│  │  │   Collection   │      │   Collection   │     │     │
│  │  └────────────────┘      └────────────────┘     │     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend Layer

#### Technologies
- **HTML5**: Semantic structure
- **CSS3**: Modern styling with CSS variables
- **Vanilla JavaScript**: No framework overhead
- **face-api.js**: TensorFlow.js-based face recognition

#### Key Components

**a) Registration Page**
- Captures student information via form
- Accesses webcam using MediaDevices API
- Detects face using face-api.js
- Extracts 128-dimensional face descriptor
- Sends data to backend API

**b) Attendance Page**
- Loads all student face descriptors
- Continuously scans for faces
- Matches detected faces against stored descriptors
- Marks attendance via API
- Displays real-time attendance list

**c) Dashboard Page**
- Displays attendance statistics
- Provides filtering options
- Shows attendance reports
- Exports data to CSV

#### Face Recognition Flow

```
Camera → Video Stream → face-api.js → Face Detection
                                    ↓
                              Face Landmarks
                                    ↓
                            Face Descriptor (128D)
                                    ↓
                          Compare with Database
                                    ↓
                            Match Found/Not Found
```

### 2. Backend Layer

#### Technologies
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Mongoose**: MongoDB ODM
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment configuration

#### Architecture Pattern: MVC (Model-View-Controller)

**Models** (`models/`)
- Define data schemas
- Implement validation
- Provide helper methods

**Controllers** (`controllers/`)
- Handle business logic
- Process requests
- Return responses

**Routes** (`routes/`)
- Define API endpoints
- Map URLs to controllers
- Apply middleware

**Middleware** (`middleware/`)
- Error handling
- Request validation
- Authentication (future)

#### Request Flow

```
HTTP Request
    ↓
Express Router
    ↓
Route Handler
    ↓
Controller Function
    ↓
Mongoose Model
    ↓
MongoDB Query
    ↓
Response
```

### 3. Data Layer

#### MongoDB Collections

**Students Collection**
- Stores student information
- Contains face descriptors
- Indexed on rollNumber for fast lookups

**Attendance Collection**
- Records daily attendance
- Prevents duplicates via unique compound index
- Indexed on date for efficient queries

#### Indexing Strategy

```javascript
// Students
{ rollNumber: 1 } // Unique index
{ class: 1, section: 1 } // Compound index
{ name: 'text' } // Text search

// Attendance
{ studentId: 1, date: 1 } // Unique compound (prevents duplicates)
{ date: 1, status: 1 } // Query optimization
{ rollNumber: 1, date: 1 } // Student lookups
```

## Data Flow

### Student Registration

```
1. User fills form → Frontend
2. Camera captures face → MediaDevices API
3. Face detection → face-api.js
4. Extract descriptor → 128D array
5. POST /api/students/register → Backend
6. Validate data → Controller
7. Save to database → MongoDB
8. Return success → Frontend
```

### Attendance Marking

```
1. Load descriptors → GET /api/students/descriptors
2. Start camera → MediaDevices API
3. Continuous detection → face-api.js (every 100ms)
4. Face found → Extract descriptor
5. Compare with loaded descriptors → FaceMatcher
6. Match found → POST /api/attendance/mark
7. Check duplicate → MongoDB query
8. Save attendance → MongoDB
9. Update UI → Frontend
```

### Report Generation

```
1. User applies filters → Frontend
2. Build query params → JavaScript
3. GET /api/attendance/report?filters → Backend
4. Query database → MongoDB aggregation
5. Format results → Controller
6. Return JSON → Frontend
7. Display table → HTML/CSS
8. Export CSV → Client-side generation
```

## Security Architecture

### Data Protection

1. **Face Descriptors**: Mathematical representations, not images
2. **HTTPS**: Encrypted communication (production)
3. **Input Validation**: Server-side validation
4. **Error Handling**: No sensitive data in errors

### Future Enhancements

- JWT authentication
- Role-based access control (Admin/Teacher)
- Rate limiting
- API key authentication
- Encrypted face descriptors

## Scalability Considerations

### Current Limitations

- Single server instance
- In-memory face matching
- No caching layer

### Scaling Strategy

**Horizontal Scaling**
- Load balancer
- Multiple backend instances
- Session management

**Performance Optimization**
- Redis caching for descriptors
- CDN for static files
- Database read replicas
- Pagination for large datasets

**Face Recognition Optimization**
- Pre-compute face embeddings
- Use GPU acceleration
- Batch processing
- Lazy loading of models

## Deployment Architecture

### Development

```
Frontend: http://localhost:8000 (Live Server)
Backend: http://localhost:5000 (Node.js)
Database: MongoDB Atlas (Cloud)
```

### Production

```
Frontend: Vercel/Netlify (CDN)
    ↓ HTTPS
Backend: Render/Railway (Serverless)
    ↓ MongoDB Protocol
Database: MongoDB Atlas (Cloud)
```

## Technology Choices Rationale

### Why Vanilla JavaScript?

- **Low Bandwidth**: No framework overhead
- **Fast Loading**: Minimal dependencies
- **Simple Deployment**: No build process
- **Easy Maintenance**: No framework updates

### Why face-api.js?

- **Free & Open Source**: No licensing costs
- **Browser-Based**: No server-side processing
- **TensorFlow.js**: Industry-standard ML
- **Good Accuracy**: 95%+ recognition rate

### Why MongoDB?

- **Flexible Schema**: Easy to modify
- **JSON-like**: Natural fit for JavaScript
- **Free Tier**: M0 cluster available
- **Cloud-Hosted**: No infrastructure management

### Why Node.js/Express?

- **JavaScript Everywhere**: Same language as frontend
- **Fast Development**: Minimal boilerplate
- **Large Ecosystem**: npm packages
- **Good Performance**: Non-blocking I/O

## Performance Metrics

### Target Performance

- **Page Load**: < 3 seconds (3G connection)
- **Face Detection**: < 100ms per frame
- **Face Recognition**: < 200ms per face
- **API Response**: < 500ms
- **Database Query**: < 100ms

### Optimization Techniques

1. **Image Compression**: 80% JPEG quality
2. **Lazy Loading**: Load models on demand
3. **Debouncing**: Limit API calls
4. **Caching**: LocalStorage for descriptors
5. **Minification**: Compress CSS/JS (production)

## Monitoring & Logging

### Current Implementation

- Console logging
- Error tracking
- Request logging (development)

### Production Recommendations

- Application monitoring (e.g., New Relic)
- Error tracking (e.g., Sentry)
- Analytics (e.g., Google Analytics)
- Uptime monitoring (e.g., UptimeRobot)

---

This architecture is designed to be simple, scalable, and suitable for rural school environments with limited internet connectivity.
