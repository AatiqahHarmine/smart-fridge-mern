const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['dairy', 'meat', 'vegetable', 'fruit', 'beverage', 'leftover', 'condiment', 'other'],
    default: 'other'
  },
  weight: { type: Number, default: 0 },        // kg
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'item' },
  expiryDate: { type: Date, required: true },
  dateAdded: { type: Date, default: Date.now },
  shelf: {
    type: String,
    enum: ['top', 'bottom', 'door', 'crisper'],
    default: 'top'
  },
  status: {
    type: String,
    enum: ['fresh', 'expiring_soon', 'expired'],
    default: 'fresh'
  },
  emoji: { type: String, default: '🍱' },
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
});

// Virtual: days until expiry
foodItemSchema.virtual('daysUntilExpiry').get(function () {
  const diff = this.expiryDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Auto-update status before save
foodItemSchema.pre('save', function (next) {
  const days = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) this.status = 'expired';
  else if (days <= 3) this.status = 'expiring_soon';
  else this.status = 'fresh';
  next();
});

foodItemSchema.set('toJSON', { virtuals: true });
foodItemSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('FoodItem', foodItemSchema);
