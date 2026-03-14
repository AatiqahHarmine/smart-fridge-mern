const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['expiry', 'temperature', 'humidity', 'motion', 'storage', 'ai_suggestion'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'danger'],
    default: 'info'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  source: { type: String, default: 'system' }, // sensor name or 'Gemini AI'
  isRead: { type: Boolean, default: false },
  relatedFood: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem',
    default: null
  },
  timestamp: { type: Date, default: Date.now }
});

alertSchema.index({ userId: 1, isRead: 1, timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);
