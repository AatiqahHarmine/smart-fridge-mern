const express = require('express');
const SensorReading = require('../models/SensorReading');
const FoodItem = require('../models/FoodItem');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/summary - all data for main dashboard
router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Latest sensor reading
    const latestSensor = await SensorReading.findOne({ userId }).sort({ timestamp: -1 });

    // Temperature history (last 24h, sampled every hour)
    const tempHistory = await SensorReading.aggregate([
      { $match: { userId, timestamp: { $gte: since24h } } },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          avgTemp: { $avg: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          timestamp: { $last: '$timestamp' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Food items
    const allFood = await FoodItem.find({ userId, isActive: true }).sort({ expiryDate: 1 });
    const expiredCount = allFood.filter(f => f.expiryDate < now).length;
    const expiringSoon = allFood.filter(f => {
      const days = Math.ceil((f.expiryDate - now) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 3;
    }).length;

    // Unread alerts
    const unreadAlerts = await Alert.countDocuments({ userId, isRead: false });
    const recentAlerts = await Alert.find({ userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('relatedFood', 'name emoji');

    res.json({
      sensor: latestSensor,
      tempHistory,
      food: {
        total: allFood.length,
        expiredCount,
        expiringSoon,
        items: allFood.slice(0, 8) // top 8
      },
      alerts: {
        unreadCount: unreadAlerts,
        recent: recentAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
