const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const { auth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const grievanceRoutes = require('./routes/grievances');
const emailService = require('./services/emailService');

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  
  // Start email listener service after DB connection
  if (process.env.NODE_ENV === 'production') {
    try {
      emailService.startEmailListener();
      console.log('Email listener service started');
    } catch (error) {
      console.error('Error starting email service:', error);
    }
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('The application will continue with limited functionality');
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Grievance Portal API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Test route for ping
app.get('/api/users/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is available' });
});

// Apply auth middleware globally
app.use(auth);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/grievances', grievanceRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
}); 