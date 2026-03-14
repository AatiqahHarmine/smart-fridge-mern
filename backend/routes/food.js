const express = require('express');
const FoodItem = require('../models/FoodItem');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/food - get all active food items
router.get('/', protect, async (req, res) => {
  try {
    const items = await FoodItem.find({ userId: req.user._id, isActive: true }).sort({ expiryDate: 1 });
    // Refresh status for each item
    const updated = items.map(item => {
      const days = Math.ceil((item.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      return { ...item.toJSON(), daysUntilExpiry: days };
    });
    res.json({ data: updated, count: updated.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/food - add food item
router.post('/', protect, async (req, res) => {
  try {
    const item = await FoodItem.create({ ...req.body, userId: req.user._id });

    // Auto-create alert if expiring soon
    const days = Math.ceil((item.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    if (days <= 3) {
      await Alert.create({
        userId: req.user._id,
        type: 'expiry',
        severity: days <= 1 ? 'danger' : 'warning',
        title: `${item.name} expires soon`,
        message: days <= 0 ? `${item.name} has already expired!` : `${item.name} expires in ${days} day(s). Use it soon.`,
        source: 'Food Tracker',
        relatedFood: item._id
      });
    }

    res.status(201).json({ message: 'Food item added', data: item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/food/:id - update food item
router.put('/:id', protect, async (req, res) => {
  try {
    const item = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item updated', data: item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/food/:id - soft delete (consumed/removed)
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item removed from fridge' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/food/expiring - items expiring within N days
router.get('/expiring', protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const items = await FoodItem.find({
      userId: req.user._id,
      isActive: true,
      expiryDate: { $lte: cutoff }
    }).sort({ expiryDate: 1 });
    res.json({ data: items, count: items.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
