const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const db = require('../config/db-config');

const router = express.Router();

// In-memory store for notifications (in a real app, this would be in a database)
const notifications = [];
let notificationId = 1;

/**
 * Helper function to create a notification
 * @param {number} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 * @returns {object} - Created notification
 */
const createNotification = (userId, title, message, type = 'info') => {
  const notification = {
    id: notificationId++,
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date()
  };
  
  notifications.push(notification);
  return notification;
};

// @route   GET /api/notifications
// @desc    Get all notifications for the current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // In a real implementation, this would query the database
    const userNotifications = notifications.filter(
      notification => notification.userId === req.user.id
    );
    
    res.json(userNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/unread
// @desc    Get unread notifications count for the current user
// @access  Private
router.get('/unread', auth, async (req, res) => {
  try {
    // In a real implementation, this would query the database
    const unreadCount = notifications.filter(
      notification => notification.userId === req.user.id && !notification.isRead
    ).length;
    
    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Get unread notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the notification
    const notification = notifications.find(n => n.id === parseInt(id));
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if the notification belongs to the user
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mark as read
    notification.isRead = true;
    
    res.json(notification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read for the current user
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    // Mark all user's notifications as read
    notifications.forEach(notification => {
      if (notification.userId === req.user.id) {
        notification.isRead = true;
      }
    });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/send
// @desc    Send a notification to a user
// @access  Private (HR Admin, Team Lead)
router.post('/send', auth, requireRole(['HR_ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    
    // Validate input
    if (!userId || !title || !message) {
      return res.status(400).json({ message: 'User ID, title, and message are required' });
    }
    
    // Check if user exists
    const user = await db.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create notification
    const notification = createNotification(userId, title, message, type || 'info');
    
    res.status(201).json({
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/broadcast
// @desc    Broadcast a notification to all users or users with specific roles
// @access  Private (HR Admin only)
router.post('/broadcast', auth, requireRole(['HR_ADMIN']), async (req, res) => {
  try {
    const { title, message, type, roles } = req.body;
    
    // Validate input
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    // In a real implementation, this would query all users from the database
    // For now, we'll use a mock list of users
    const users = [
      { id: 1, role: 'HR Admin' },
      { id: 2, role: 'Team Lead' },
      { id: 3, role: 'Employee' }
    ];
    
    // Filter users by role if specified
    const targetUsers = roles && roles.length > 0
      ? users.filter(user => roles.includes(user.role))
      : users;
    
    // Create notifications for each target user
    const createdNotifications = targetUsers.map(user => 
      createNotification(user.id, title, message, type || 'info')
    );
    
    res.status(201).json({
      message: `Notification broadcast to ${createdNotifications.length} users`,
      count: createdNotifications.length
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the notification index
    const index = notifications.findIndex(n => n.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if the notification belongs to the user
    if (notifications[index].userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Remove the notification
    notifications.splice(index, 1);
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export the router and the createNotification function for use in other modules
module.exports = {
  router,
  createNotification
};
