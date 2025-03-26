const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
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
    required: true
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
    mimetype: String
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
  lastReminderSent: {
    type: Date,
    default: null
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
  this.updatedAt = new Date();
  next();
});

const Grievance = mongoose.model('Grievance', grievanceSchema);

module.exports = Grievance; 