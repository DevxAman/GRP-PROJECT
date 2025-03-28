const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Grievance = require('../models/Grievance');
const User = require('../models/User');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.WEBMAIL_USER,
        pass: process.env.WEBMAIL_PASSWORD
      }
    });

    this.imap = new Imap({
      user: process.env.WEBMAIL_USER,
      password: process.env.WEBMAIL_PASSWORD,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      tls: process.env.SMTP_SECURE === 'true'
    });
  }

  // Send email notification for grievance status update
  async sendStatusUpdate(grievanceId, status) {
    try {
      const grievance = await Grievance.findById(grievanceId).populate('user');
      if (!grievance) throw new Error('Grievance not found');

      const mailOptions = {
        from: process.env.WEBMAIL_USER,
        to: grievance.user.email,
        subject: `Grievance Status Update - ${grievance.subject}`,
        html: `
          <h2>Grievance Status Update</h2>
          <p>Your grievance has been ${status}.</p>
          <p>Tracking ID: ${grievance.trackingId}</p>
          <p>Subject: ${grievance.subject}</p>
          <p>You can track your grievance status at: ${process.env.FRONTEND_URL}/track-grievance</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      grievance.lastEmailSent = new Date();
      await grievance.save();
    } catch (error) {
      console.error('Error sending status update:', error);
      throw error;
    }
  }

  // Send reminder for pending grievances
  async sendReminder(grievanceId) {
    try {
      const grievance = await Grievance.findById(grievanceId).populate('user');
      if (!grievance) throw new Error('Grievance not found');

      const mailOptions = {
        from: process.env.WEBMAIL_USER,
        to: grievance.user.email,
        subject: `Reminder: Pending Grievance - ${grievance.subject}`,
        html: `
          <h2>Grievance Reminder</h2>
          <p>This is a reminder that your grievance is still pending.</p>
          <p>Tracking ID: ${grievance.trackingId}</p>
          <p>Subject: ${grievance.subject}</p>
          <p>You can track your grievance status at: ${process.env.FRONTEND_URL}/track-grievance</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      grievance.lastEmailSent = new Date();
      await grievance.save();
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }

  // Start listening for email replies
  startEmailListener() {
    this.imap.once('ready', () => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) throw err;

        this.imap.on('mail', async (numNew) => {
          const f = this.imap.seq.fetch('1:*', {
            bodies: '',
            struct: true
          });

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) throw err;

                // Check if this is a reply to a grievance
                const subject = parsed.subject;
                const trackingId = subject.match(/\[GNDEC-\d+\]/)?.[0];
                
                if (trackingId) {
                  const grievance = await Grievance.findOne({ trackingId });
                  if (grievance) {
                    // Add email to thread
                    grievance.emailThread.push({
                      messageId: parsed.messageId,
                      subject: parsed.subject,
                      from: parsed.from.text,
                      to: parsed.to.text,
                      content: parsed.text,
                      timestamp: parsed.date
                    });

                    // Add as comment
                    grievance.comments.push({
                      text: parsed.text,
                      isEmailReply: true,
                      emailMessageId: parsed.messageId
                    });

                    grievance.lastEmailReceived = new Date();
                    await grievance.save();
                  }
                }
              });
            });
          });
        });
      });
    });

    this.imap.once('error', (err) => {
      console.error('IMAP error:', err);
    });

    this.imap.connect();
  }
}

module.exports = new EmailService(); 