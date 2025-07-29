const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'hrms_secret_key_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hrms_refresh_secret_key_2024';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

// Store for refresh tokens (in a real app, this would be in Redis or a database)
const refreshTokens = new Set();

/**
 * Authentication middleware
 * Verifies the JWT token and attaches the user to the request
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Add token expiration check
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return res.status(401).json({ 
          message: 'Token has expired', 
          code: 'TOKEN_EXPIRED'
        });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token has expired', 
          code: 'TOKEN_EXPIRED'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

/**
 * Generate access token
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId, role) => {
  const refreshToken = jwt.sign(
    { userId, role },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRATION }
  );
  
  // Store the refresh token
  refreshTokens.add(refreshToken);
  
  return refreshToken;
};

/**
 * Refresh token middleware
 * Generates a new access token using a valid refresh token
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }
  
  // Check if the refresh token exists in our store
  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.role);
    
    // Remove the old refresh token
    refreshTokens.delete(refreshToken);
    
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
};

/**
 * Logout function to invalidate refresh tokens
 */
const logout = (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  
  res.status(204).send();
};

module.exports = { 
  auth, 
  requireRole, 
  generateAccessToken,
  generateRefreshToken,
  refreshToken,
  logout,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION
};
