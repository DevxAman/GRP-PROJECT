# GNDEC Grievance Redressal Portal

A full-stack web application for managing grievances at GNDEC, featuring secure authentication, multi-step grievance submission, tracking, and email notifications.

## Features

- **Secure Authentication**: Sign-up and login with GNDEC email domain and phone verification
- **Multi-step Grievance Submission**: User-friendly form with file attachments
- **Grievance Tracking**: Real-time status updates on submitted grievances
- **Email Notifications**: Integration with GNDEC webmail for updates and reminders
- **Admin Dashboard**: For managing and responding to grievances
- **Mobile Responsive**: Works seamlessly on all devices

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT with email and OTP verification
- **Email Service**: GNDEC Webmail integration via Nodemailer

## Deployment Guide

### Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account (or another MongoDB provider)
- GNDEC Webmail credentials for email notifications
- Render.com, Railway.app, or Vercel account for hosting

### Backend Deployment (Render.com)

1. **Set up MongoDB Atlas**
   - Create a MongoDB Atlas cluster
   - Create a database user
   - Whitelist IP addresses (0.0.0.0/0 for public access)
   - Get your MongoDB connection string

2. **Deploy to Render**
   - Sign up/login to Render.com
   - Create a new Web Service
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables from your `.env` file
   - Deploy the service

3. **Configure Environment Variables on Render**
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/grievance-portal
   JWT_SECRET=your_secure_jwt_secret
   CORS_ORIGIN=https://your-frontend-domain.com
   UPLOAD_PATH=./uploads
   SMTP_HOST=smtp.gndec.ac.in
   SMTP_PORT=587
   SMTP_SECURE=false
   WEBMAIL_USER=your_webmail@gndec.ac.in
   WEBMAIL_PASSWORD=your_webmail_password
   FRONTEND_URL=https://your-frontend-domain.com
   ```

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**
   - Sign up/login to Vercel
   - Import your GitHub repository
   - Configure the project:
     - Framework preset: Next.js
     - Root directory: ./frontend
   - Add environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-render-url.com
     ```
   - Deploy

2. **Set Frontend URL in Backend**
   - After deploying, update the CORS_ORIGIN and FRONTEND_URL variables 
     in your backend environment settings to match your Vercel domain

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gndec-grievance-portal.git
   cd gndec-grievance-portal
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   - Create `.env` in the backend directory
   - Create `.env.local` in the frontend directory
   - Fill with appropriate development values

4. **Run the application**
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd ../frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## License

This project is licensed under the MIT License.

## Acknowledgments

Special thanks to GNDEC for supporting this project.
