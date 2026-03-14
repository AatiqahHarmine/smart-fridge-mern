const express = require('express');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/alerts - get all alerts
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const alerts = await Alert.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('relatedFood', 'name emoji');
    const unreadCount = await Alert.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ data: alerts, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/alerts/:id/read - mark alert as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Alert.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/alerts/read-all - mark all as read
router.put('/read-all', protect, async (req, res) => {
  try {
    await Alert.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
