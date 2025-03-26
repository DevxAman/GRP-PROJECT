const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// Verify token endpoint
router.get('/verify-token', async (req, res) => {
  try {
    console.log('Verifying token...');
    // The auth middleware already verified the token and attached the user
    // We just need to check if req.user exists
    if (!req.user) {
      console.log('Token verification failed - no user attached');
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    console.log('Token verified successfully for user:', req.user._id);
    res.status(200).json({ 
      valid: true, 
      userId: req.user._id,
      message: 'Token is valid' 
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    console.log('Fetching user profile for user:', req.user._id);
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      console.error('User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Profile fetched successfully');
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    console.log('Updating profile for user:', req.user._id);
    const { name, currentPassword, newPassword, studentDetails } = req.body;
    console.log('Update data:', { 
      name, 
      hasCurrentPassword: !!currentPassword, 
      hasNewPassword: !!newPassword,
      hasStudentDetails: !!studentDetails
    });

    const user = await User.findById(req.user._id);
    if (!user) {
      console.error('User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update student details if provided
    if (studentDetails) {
      user.studentDetails = {
        ...user.studentDetails,
        ...studentDetails
      };
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      console.log('Attempting password update');
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        console.error('Current password is incorrect');
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
      console.log('Password updated successfully');
    }

    await user.save();
    console.log('Profile updated successfully');

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router; 