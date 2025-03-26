const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { auth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const grievanceRoutes = require('./routes/grievances');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB (with error handling)
try {
  connectDB();
} catch (error) {
  console.error('MongoDB connection failed. The app will run with limited functionality.');
}

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Grievance Portal API is running' });
});

// Apply auth middleware globally
app.use(auth);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/grievances', grievanceRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 