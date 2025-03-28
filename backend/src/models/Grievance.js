const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Personal details
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  year: {
    type: String,
    required: [true, 'Year is required']
  },
  universityRollNumber: {
    type: String,
    required: [true, 'University Roll Number is required']
  },
  branch: {
    type: String,
    required: [true, 'Branch is required']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile Number is required'],
    match: [/^\d{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  // Grievance details
  category: {
    type: String,
    required: true,
    enum: ['academic', 'hostel', 'infrastructure', 'other']
  },
  subject: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: {
    type: String,
    required: true
  },
  trackingId: {
    type: String,
    unique: true,
    sparse: true // Allows null values to not be considered for uniqueness
  },
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    default: ''
  },
  comments: [{
    text: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isEmailReply: {
      type: Boolean,
      default: false
    },
    emailMessageId: String
  }],
  emailThread: [{
    messageId: String,
    subject: String,
    from: String,
    to: String,
    content: String,
    timestamp: Date,
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  lastEmailSent: Date,
  lastEmailReceived: Date,
  emailStatus: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
grievanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Grievance = mongoose.model('Grievance', grievanceSchema);

module.exports = Grievance; 