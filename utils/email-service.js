/**
 * Email Service Utility
 * 
 * This module provides functionality for sending various types of email notifications
 * in the HRMS system. It uses nodemailer for email delivery and supports templates.
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration from environment variables
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password'
  },
  from: process.env.EMAIL_FROM || 'HRMS System <hrms@example.com>'
};

// Feature flag to enable/disable email sending
const emailEnabled = process.env.ENABLE_EMAIL === 'true';

/**
 * Create a reusable transporter object using nodemailer
 */
const createTransporter = () => {
  if (!emailEnabled) {
    console.log('Email sending is disabled. Set ENABLE_EMAIL=true to enable.');
    return null;
  }
  
  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth
  });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise} - Resolves with info about the sent email or null if disabled
 */
const sendEmail = async (options) => {
  if (!emailEnabled) {
    console.log('Email sending is disabled. Would have sent:', options);
    return null;
  }
  
  try {
    const transporter = createTransporter();
    if (!transporter) return null;
    
    const mailOptions = {
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a welcome email to a new user
 * @param {Object} user - User object
 * @param {string} user.email - User email
 * @param {string} user.name - User name
 * @param {string} password - Initial password (only for new accounts)
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendWelcomeEmail = async (user, password = null) => {
  const subject = 'Welcome to HRMS Enhanced';
  
  const text = `Hello ${user.name},

Welcome to HRMS Enhanced! Your account has been created successfully.

${password ? `Your initial password is: ${password}\nPlease change your password after your first login.` : ''}

You can access the system at: ${process.env.CLIENT_URL || 'http://localhost:3000'}

Best regards,
HRMS Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3f51b5;">Welcome to HRMS Enhanced!</h2>
      <p>Hello ${user.name},</p>
      <p>Your account has been created successfully.</p>
      
      ${password ? `
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Your initial password is:</strong> ${password}</p>
          <p>Please change your password after your first login.</p>
        </div>
      ` : ''}
      
      <p>You can access the system at: <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">${process.env.CLIENT_URL || 'http://localhost:3000'}</a></p>
      
      <p>Best regards,<br>HRMS Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send a password reset email
 * @param {Object} user - User object
 * @param {string} user.email - User email
 * @param {string} user.name - User name
 * @param {string} resetToken - Password reset token
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  const subject = 'HRMS Enhanced - Password Reset';
  
  const text = `Hello ${user.name},

You requested a password reset for your HRMS Enhanced account.

Please use the following link to reset your password: ${resetUrl}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
HRMS Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3f51b5;">Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset for your HRMS Enhanced account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3f51b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Your Password</a>
      </div>
      
      <p>Or copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
      
      <p><strong>This link will expire in 1 hour.</strong></p>
      
      <p>If you did not request this password reset, please ignore this email.</p>
      
      <p>Best regards,<br>HRMS Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send a notification email
 * @param {Object} user - User object
 * @param {string} user.email - User email
 * @param {string} user.name - User name
 * @param {Object} notification - Notification object
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {string} notification.type - Notification type (info, success, warning, error)
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendNotificationEmail = async (user, notification) => {
  // Map notification type to color
  const typeColors = {
    info: '#2196f3',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336'
  };
  
  const color = typeColors[notification.type] || typeColors.info;
  
  const subject = `HRMS Enhanced - ${notification.title}`;
  
  const text = `Hello ${user.name},

${notification.message}

You can view all your notifications by logging into your account at: ${process.env.CLIENT_URL || 'http://localhost:3000'}

Best regards,
HRMS Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${color};">${notification.title}</h2>
      <p>Hello ${user.name},</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${color};">
        <p>${notification.message}</p>
      </div>
      
      <p>You can view all your notifications by logging into your account at: <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">${process.env.CLIENT_URL || 'http://localhost:3000'}</a></p>
      
      <p>Best regards,<br>HRMS Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send a payslip email
 * @param {Object} employee - Employee object
 * @param {string} employee.email - Employee email
 * @param {string} employee.name - Employee name
 * @param {Object} payroll - Payroll object
 * @param {string} payroll.period - Pay period (e.g., "January 2023")
 * @param {number} payroll.basicSalary - Basic salary amount
 * @param {number} payroll.allowances - Allowances amount
 * @param {number} payroll.deductions - Deductions amount
 * @param {number} payroll.netSalary - Net salary amount
 * @param {Buffer|string} payslipAttachment - PDF attachment of the payslip (optional)
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendPayslipEmail = async (employee, payroll, payslipAttachment = null) => {
  const subject = `HRMS Enhanced - Payslip for ${payroll.period}`;
  
  const text = `Hello ${employee.name},

Your payslip for ${payroll.period} is now available.

Salary Details:
- Basic Salary: $${payroll.basicSalary.toFixed(2)}
- Allowances: $${payroll.allowances.toFixed(2)}
- Deductions: $${payroll.deductions.toFixed(2)}
- Net Salary: $${payroll.netSalary.toFixed(2)}

Please find attached your detailed payslip.

Best regards,
HRMS Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3f51b5;">Payslip for ${payroll.period}</h2>
      <p>Hello ${employee.name},</p>
      <p>Your payslip for <strong>${payroll.period}</strong> is now available.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
          <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">Basic Salary</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${payroll.basicSalary.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">Allowances</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${payroll.allowances.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">Deductions</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${payroll.deductions.toFixed(2)}</td>
        </tr>
        <tr style="font-weight: bold;">
          <td style="padding: 10px;">Net Salary</td>
          <td style="padding: 10px; text-align: right;">$${payroll.netSalary.toFixed(2)}</td>
        </tr>
      </table>
      
      <p>Please find attached your detailed payslip.</p>
      
      <p>Best regards,<br>HRMS Team</p>
    </div>
  `;
  
  const mailOptions = {
    to: employee.email,
    subject,
    text,
    html
  };
  
  // Add attachment if provided
  if (payslipAttachment) {
    mailOptions.attachments = [
      {
        filename: `Payslip_${payroll.period.replace(/\s/g, '_')}.pdf`,
        content: payslipAttachment
      }
    ];
  }
  
  return sendEmail(mailOptions);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendPayslipEmail,
  emailEnabled
};
