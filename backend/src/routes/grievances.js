const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Grievance = require('../models/Grievance');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Create new grievance
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      name,
      email,
      year,
      universityRollNumber,
      branch,
      mobileNumber,
      type,
      subject,
      title,
      description
    } = req.body;

    // Create or find user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        password: Math.random().toString(36).slice(-8), // Generate random password
        studentDetails: {
          year,
          universityRollNumber,
          branch,
          mobileNumber
        }
      });
      await user.save();
    }

    // Create grievance
    const grievance = new Grievance({
      user: user._id,
      type,
      subject,
      title,
      description,
      attachments: req.files?.map((file) => ({
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype
      })) || []
    });

    await grievance.save();

    res.status(201).json(grievance);
  } catch (error) {
    console.error('Create grievance error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all grievances (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const grievances = await Grievance.find()
      .populate('user', 'name email studentDetails')
      .sort({ createdAt: -1 });

    res.json(grievances);
  } catch (error) {
    console.error('Get grievances error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's grievances
router.get('/', auth, async (req, res) => {
  try {
    const grievances = await Grievance.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(grievances);
  } catch (error) {
    console.error('Get user grievances error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ message: 'Server error' });
  }
});

// Update grievance status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, adminResponse } = req.body;
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    grievance.status = status;
    grievance.adminResponse = adminResponse;
    await grievance.save();

    res.json(grievance);
  } catch (error) {
    console.error('Update grievance error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 