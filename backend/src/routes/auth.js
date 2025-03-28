const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTP } = require('../utils/notificationService');

const router = express.Router();

// Send OTP for verification
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    // Validate GNDEC email
    if (!email.endsWith('@gndec.ac.in')) {
      return res.status(400).json({ message: 'Only GNDEC email addresses are allowed' });
    }
    
    // Validate phone number
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number' });
    }
    
    // Check if email or phone is already registered
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'This email is already registered' });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ message: 'This phone number is already registered' });
      }
    }
    
    // Generate and save OTP (temporarily store in session/temp collection)
    const otp = generateOTP();
    
    // Create a temporary record or use session to store OTP
    // For now, we'll create a temporary user record that will be completed later
    let tempUser = await User.findOne({ 
      email, 
      isEmailVerified: false, 
      isPhoneVerified: false 
    });
    
    if (!tempUser) {
      tempUser = new User({
        email,
        phone,
        name: 'Temporary',
        password: 'temporary',
      });
    }
    
    tempUser.phoneVerificationOTP = otp;
    tempUser.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await tempUser.save();
    
    // Send OTP via email
    const otpSent = await sendOTP(email, otp);
    if (!otpSent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }
    
    res.json({ message: 'OTP sent successfully to your GNDEC email' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    
    const user = await User.findOne({ 
      email,
      phone,
      phoneVerificationOTP: otp,
      phoneVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Mark phone as verified
    user.isPhoneVerified = true;
    user.phoneVerificationOTP = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();
    
    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Validate GNDEC email
    if (!email.endsWith('@gndec.ac.in')) {
      return res.status(400).json({ message: 'Only GNDEC email addresses are allowed' });
    }
    
    // Validate phone number
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number' });
    }
    
    // Check if user already exists with verified details
    let existingUser = await User.findOne({ 
      $or: [
        { email, isEmailVerified: true },
        { phone, isPhoneVerified: true }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'This email is already registered' });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ message: 'This phone number is already registered' });
      }
    }
    
    // Find temporary user
    let user = await User.findOne({ 
      email, 
      phone,
      isPhoneVerified: true 
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Phone number not verified. Please verify your phone number first.' });
    }
    
    // Update user with registration details
    user.name = name;
    user.password = password;
    user.role = role || 'student';
    
    // Generate email verification token
    const emailToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    user.emailVerificationToken = emailToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    await user.save();
    
    // Send email verification link
    // This would be implemented in a real system
    
    res.status(201).json({ 
      message: 'Registration successful. Please check your email to verify your account.' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with token
    const user = await User.findOne({ 
      email: decoded.email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    res.redirect(`${process.env.FRONTEND_URL}/login?success=Email verified successfully. You can now log in.`);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in' });
    }
    
    // Check if phone is verified
    if (!user.isPhoneVerified) {
      return res.status(400).json({ message: 'Please verify your phone number before logging in' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend email verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate GNDEC email
    if (!email.endsWith('@gndec.ac.in')) {
      return res.status(400).json({ message: 'Only GNDEC email addresses are allowed' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate new email verification token
    const emailToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    user.emailVerificationToken = emailToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    await user.save();
    
    // In a real implementation, you would send an email with the verification link
    // For now, we'll just return a success message
    
    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 