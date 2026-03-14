const express = require('express');
const SensorReading = require('../models/SensorReading');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/sensors/reading  - ESP32 sends data here via MQTT bridge
router.post('/reading', protect, async (req, res) => {
  try {
    const { temperature, humidity, weightTotal, motionDetected, distanceTop, distanceBottom } = req.body;

    // Calculate fullness % from ultrasonic distance
    // Assuming fridge depth = 50cm, so 50cm = 0%, 0cm = 100%
    const fullnessTop = distanceTop ? Math.min(100, Math.max(0, Math.round((1 - distanceTop / 50) * 100))) : 0;
    const fullnessBottom = distanceBottom ? Math.min(100, Math.max(0, Math.round((1 - distanceBottom / 50) * 100))) : 0;

    const reading = await SensorReading.create({
      userId: req.user._id,
      fridgeId: req.user.fridgeId,
      temperature, humidity, weightTotal,
      motionDetected, distanceTop, distanceBottom,
      fullnessTop, fullnessBottom
    });

    res.status(201).json({ message: 'Reading saved', data: reading });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save reading', error: error.message });
  }
});

// GET /api/sensors/latest - get latest sensor reading
router.get('/latest', protect, async (req, res) => {
  try {
    const latest = await SensorReading.findOne({ userId: req.user._id }).sort({ timestamp: -1 });
    if (!latest) return res.status(404).json({ message: 'No sensor data found' });
    res.json({ data: latest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/sensors/history?hours=24 - temperature/humidity history
router.get('/history', protect, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await SensorReading.find({
      userId: req.user._id,
      timestamp: { $gte: since }
    }).sort({ timestamp: 1 }).select('temperature humidity timestamp fullnessTop fullnessBottom weightTotal');

    res.json({ data: readings, count: readings.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/sensors/stats - average stats for a day
router.get('/stats', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stats = await SensorReading.aggregate([
      { $match: { userId: req.user._id, timestamp: { $gte: since } } },
      {
        $group: {
          _id: null,
          avgTemp: { $avg: '$temperature' },
          minTemp: { $min: '$temperature' },
          maxTemp: { $max: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgWeight: { $avg: '$weightTotal' },
          totalReadings: { $sum: 1 }
        }
      }
    ]);
    res.json({ data: stats[0] || {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
