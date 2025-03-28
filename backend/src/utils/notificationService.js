const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configure email transporter with fallback options
const getTransporter = () => {
  // Check if GNDEC webmail credentials are provided
  if (process.env.WEBMAIL_USER && process.env.WEBMAIL_PASSWORD) {
    console.log('Using GNDEC webmail configuration');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gndec.ac.in',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.WEBMAIL_USER,
        pass: process.env.WEBMAIL_PASSWORD
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
  } 
  
  // Fallback to a test email service for development/testing
  console.log('Using fallback email configuration');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal_pass'
    }
  });
};

// Generate OTP - 6 digit numeric code
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP via email
const sendOTP = async (email, otp) => {
  try {
    if (!email || !otp) {
      console.error('Missing required parameters for sendOTP');
      return false;
    }

    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.WEBMAIL_USER || 'GNDEC Grievance Portal <noreply@gndec.ac.in>',
      to: email,
      subject: 'GNDEC Grievance Portal - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
          <h2 style="color: #4a86e8;">OTP Verification</h2>
          <p>Your One-Time Password (OTP) for verification is:</p>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This is an automated message from GNDEC Grievance Portal. Please do not reply to this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

// Send grievance notification
const sendGrievanceNotification = async (email, grievanceId, status) => {
  try {
    if (!email || !grievanceId) {
      console.error('Missing required parameters for sendGrievanceNotification');
      return false;
    }

    const transporter = getTransporter();
    
    const statusMessage = getStatusMessage(status);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const mailOptions = {
      from: process.env.WEBMAIL_USER || 'GNDEC Grievance Portal <noreply@gndec.ac.in>',
      to: email,
      subject: `GNDEC Grievance Portal - Status Update for Grievance #${grievanceId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
          <h2 style="color: #4a86e8;">Grievance Status Update</h2>
          <p>Your grievance <strong>#${grievanceId}</strong> has been ${statusMessage}.</p>
          <p>You can track your grievance status at:</p>
          <p style="text-align: center;">
            <a href="${frontendUrl}/track-grievance?id=${grievanceId}" 
               style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Track Your Grievance
            </a>
          </p>
          <p>If you have any questions, please reply to this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This is an automated message from GNDEC Grievance Portal.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Send reminder for pending grievances
const sendReminder = async (email, grievanceId) => {
  try {
    if (!email || !grievanceId) {
      console.error('Missing required parameters for sendReminder');
      return false;
    }

    const transporter = getTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const mailOptions = {
      from: process.env.WEBMAIL_USER || 'GNDEC Grievance Portal <noreply@gndec.ac.in>',
      to: email,
      subject: `GNDEC Grievance Portal - Reminder for Grievance #${grievanceId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
          <h2 style="color: #4a86e8;">Grievance Reminder</h2>
          <p>This is a reminder that your grievance <strong>#${grievanceId}</strong> is still pending.</p>
          <p>You can track your grievance status at:</p>
          <p style="text-align: center;">
            <a href="${frontendUrl}/track-grievance?id=${grievanceId}" 
               style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Track Your Grievance
            </a>
          </p>
          <p>If you have any questions, please reply to this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This is an automated message from GNDEC Grievance Portal.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reminder email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending reminder:', error);
    return false;
  }
};

// Helper function to get appropriate status message
const getStatusMessage = (status) => {
  switch (status) {
    case 'pending':
      return 'received and is pending review';
    case 'in-progress':
      return 'assigned and is in progress';
    case 'resolved':
      return 'resolved successfully';
    case 'rejected':
      return 'reviewed and cannot be processed';
    case 'submitted':
      return 'submitted successfully';
    default:
      return 'updated';
  }
};

module.exports = {
  generateOTP,
  sendOTP,
  sendGrievanceNotification,
  sendReminder
}; 