const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { generateOTP, sendOTP } = require('../utils/notificationService');

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

// Send OTP for phone verification
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Validate phone number
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Check if phone number matches user's profile
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'Phone number not found in user profile' });
    }

    // Generate and save OTP
    const otp = generateOTP();
    user.phoneVerificationOTP = otp;
    user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP via email
    const otpSent = await sendOTP(user.email, otp);
    if (!otpSent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ 
      phone,
      phoneVerificationOTP: otp,
      phoneVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update verification status
    user.isPhoneVerified = true;
    user.phoneVerificationOTP = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Phone number verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile with phone number
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Validate phone number
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Check if phone number is already in use
    const existingUser = await User.findOne({ phone });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }

    // Update user profile
    req.user.phone = phone;
    await req.user.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 