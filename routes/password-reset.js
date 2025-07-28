const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db-config');
const { auth } = require('../middleware/auth');
const { sendPasswordResetEmail, emailEnabled } = require('../utils/email-service');

const router = express.Router();

// In-memory store for password reset tokens (in a real app, this would be in a database)
const passwordResetTokens = new Map();

// Helper function to validate password strength
const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
  return strongPasswordRegex.test(password);
};

// @route   POST /api/password-reset/request
// @desc    Request password reset
// @access  Public
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await db.findUserByEmail(email);
    if (!user) {
      // Don't reveal that the email doesn't exist for security reasons
      return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    }

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Store the token with the user ID and expiry
    passwordResetTokens.set(resetToken, {
      userId: user.id,
      expiry: resetTokenExpiry
    });

    // Send password reset email if email service is enabled
    if (emailEnabled) {
      try {
        await sendPasswordResetEmail(user, resetToken);
        console.log(`Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Continue with the response even if email fails
      }
    } else {
      // For development/testing when email is disabled
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    res.status(200).json({
      message: 'If your email is registered, you will receive a password reset link',
      // In a real app, don't include the token in the response
      // This is just for demonstration purposes in development mode
      ...(process.env.NODE_ENV !== 'production' && { token: resetToken })
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/password-reset/verify
// @desc    Verify password reset token
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Check if token exists and is valid
    const resetData = passwordResetTokens.get(token);
    if (!resetData) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Check if token is expired
    if (resetData.expiry < Date.now()) {
      passwordResetTokens.delete(token);
      return res.status(400).json({ message: 'Token has expired' });
    }

    res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/password-reset/reset
// @desc    Reset password with token
// @access  Public
router.post('/reset', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate input
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
      });
    }

    // Check if token exists and is valid
    const resetData = passwordResetTokens.get(token);
    if (!resetData) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Check if token is expired
    if (resetData.expiry < Date.now()) {
      passwordResetTokens.delete(token);
      return res.status(400).json({ message: 'Token has expired' });
    }

    // Get user
    const user = await db.findUserById(resetData.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password in the database
    await db.updateUserPassword(user.id, hashedPassword);
    console.log(`Password updated for user ${user.username}`);

    // Remove the used token
    passwordResetTokens.delete(token);

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/password-reset/change
// @desc    Change password (when logged in)
// @access  Private
router.post('/change', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = req.user;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password in the database
    await db.updateUserPassword(user.id, hashedPassword);
    console.log(`Password changed for user ${user.username}`);

    res.status(200).json({ message: 'Password has been changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
