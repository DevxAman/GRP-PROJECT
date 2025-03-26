const express = require('express');
const multer = require('multer');
const path = require('path');
const Grievance = require('../models/Grievance');
const User = require('../models/User');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log('Created uploads directory');
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
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
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// Handle multer errors
const uploadMiddleware = (req, res, next) => {
  upload.array('attachments', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'File too large. Maximum file size is 10MB.' 
        });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ message: err.message });
    }
    
    // Everything went fine
    next();
  });
};

// Generate a unique tracking ID
const generateTrackingID = async () => {
  const prefix = 'GR';
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  const trackingId = `${prefix}-${randomDigits}`;
  
  // Check if this tracking ID already exists
  const existingGrievance = await Grievance.findOne({ trackingId });
  if (existingGrievance) {
    // If it exists, generate a new one recursively
    return generateTrackingID();
  }
  
  return trackingId;
};

// Create new grievance
router.post('/', requireAuth, uploadMiddleware, async (req, res) => {
  try {
    console.log('Received grievance submission request');
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    // Map 'category' to 'type' for backwards compatibility
    const category = req.body.category || req.body.type;

    const {
      subject,
      description
    } = req.body;

    // Validate required fields
    if (!category || !subject || !description) {
      console.error('Missing required fields');
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Use the authenticated user
    const user = req.user;
    console.log('Using authenticated user:', user._id);

    // Generate tracking ID
    const trackingId = await generateTrackingID();

    // Create grievance
    console.log('Creating new grievance with category:', category);
    const grievance = new Grievance({
      user: user._id,
      type: category.toLowerCase(), // Ensure lowercase to match enum
      subject,
      title: subject, // Use subject as title if title is missing
      description,
      trackingId,
      attachments: req.files?.map((file) => ({
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype
      })) || []
    });

    await grievance.save();
    console.log('Grievance created successfully:', grievance._id);

    res.status(201).json({
      message: 'Grievance filed successfully',
      trackingId,
      status: grievance.status,
      createdAt: grievance.createdAt
    });
  } catch (error) {
    console.error('Error creating grievance:', error);
    res.status(500).json({
      message: 'Error creating grievance',
      error: error.message
    });
  }
});

// Track grievance by tracking ID (requires authentication)
router.get('/track/:trackingId', requireAuth, async (req, res) => {
  try {
    const { trackingId } = req.params;
    const grievance = await Grievance.findOne({ trackingId })
      .populate('user', 'name email studentDetails');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found with this tracking ID' });
    }

    // Verify that the authenticated user is the owner of the grievance or an admin
    const isOwner = grievance.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      console.log(`Unauthorized access attempt to grievance ${trackingId} by user ${req.user._id}`);
      return res.status(403).json({ 
        message: 'You do not have permission to view this grievance',
        details: 'For security reasons, grievances can only be viewed by the user who submitted them or an administrator.'
      });
    }

    // Send the grievance details if the user is authorized
    res.json({
      trackingId: grievance.trackingId,
      status: grievance.status,
      subject: grievance.subject,
      description: grievance.description,
      category: grievance.type,
      response: grievance.adminResponse,
      createdAt: grievance.createdAt,
      updatedAt: grievance.updatedAt
    });
  } catch (error) {
    console.error('Track grievance error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if a grievance exists and can receive reminders
router.get('/check/:trackingId', requireAuth, async (req, res) => {
  try {
    const { trackingId } = req.params;
    const grievance = await Grievance.findOne({ trackingId })
      .select('trackingId status subject type createdAt user');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found with this tracking ID' });
    }

    // Verify that the authenticated user is the owner of the grievance or an admin
    const isOwner = grievance.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      console.log(`Unauthorized access attempt to check grievance ${trackingId} by user ${req.user._id}`);
      return res.status(403).json({ 
        message: 'You do not have permission to check this grievance',
        details: 'For security reasons, grievances can only be accessed by the user who submitted them or an administrator.'
      });
    }

    // Remove user ID from response for security
    const responseData = grievance.toObject();
    delete responseData.user;

    res.json(responseData);
  } catch (error) {
    console.error('Check grievance error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all grievances (admin only)
router.get('/admin', requireAuth, async (req, res) => {
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
router.get('/my-grievances', requireAuth, async (req, res) => {
  try {
    const grievances = await Grievance.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(grievances);
  } catch (error) {
    console.error('Get user grievances error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's pending grievances for reminders
router.get('/my-pending-grievances', requireAuth, async (req, res) => {
  try {
    const grievances = await Grievance.find({ 
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] }
    }).sort({ createdAt: -1 });

    res.json(grievances);
  } catch (error) {
    console.error('Get pending grievances error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send reminder for a grievance
router.post('/send-reminder', requireAuth, async (req, res) => {
  try {
    const { trackingId, message } = req.body;
    
    if (!trackingId || !message) {
      return res.status(400).json({ message: 'Tracking ID and message are required' });
    }

    // Find the grievance
    const grievance = await Grievance.findOne({ trackingId });
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found with this tracking ID' });
    }

    // Only allow reminders for pending or in-progress grievances
    if (!['pending', 'in-progress'].includes(grievance.status)) {
      return res.status(400).json({ 
        message: `Cannot send reminder for grievance with status "${grievance.status}"` 
      });
    }

    // Verify ownership
    const isOwner = grievance.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only send reminders for your own grievances' });
    }

    // Add reminder logic here (e.g., store in database, send email to admin, etc.)
    console.log(`Reminder sent for grievance ${trackingId}: ${message}`);

    // Update lastReminderSent for tracking purposes
    grievance.lastReminderSent = new Date();
    await grievance.save();

    res.json({ message: 'Reminder sent successfully' });
  } catch (error) {
    console.error('Send reminder error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update grievance status (admin only)
router.patch('/:id/status', requireAuth, async (req, res) => {
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
    if (adminResponse) {
      grievance.adminResponse = adminResponse;
    }
    await grievance.save();

    res.json(grievance);
  } catch (error) {
    console.error('Update grievance error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 