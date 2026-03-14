const mongoose = require('mongoose');
const User = require('../models/User');
const SensorReading = require('../models/SensorReading');
const FoodItem = require('../models/FoodItem');
const Alert = require('../models/Alert');
require('dotenv').config();

const sampleUser = {
  name: 'Nicholas Sun',
  email: 'demo@smartfridge.com',
  password: 'demo1234',
  fridgeId: 'FRIDGE-DEMO01'
};

const foodItems = [
  { name: 'Milk', category: 'dairy', weight: 0.92, emoji: '🥛', shelf: 'door', expiryDate: new Date(Date.now() + 2 * 86400000) },
  { name: 'Leftover Curry', category: 'leftover', weight: 0.41, emoji: '🍛', shelf: 'top', expiryDate: new Date(Date.now() + 1 * 86400000) },
  { name: 'Strawberries', category: 'fruit', weight: 0.30, emoji: '🍓', shelf: 'crisper', expiryDate: new Date(Date.now() + 3 * 86400000) },
  { name: 'Broccoli', category: 'vegetable', weight: 0.45, emoji: '🥦', shelf: 'crisper', expiryDate: new Date(Date.now() + 4 * 86400000) },
  { name: 'Cheddar Cheese', category: 'dairy', weight: 0.22, emoji: '🧀', shelf: 'top', expiryDate: new Date(Date.now() + 12 * 86400000) },
  { name: 'Eggs', category: 'other', weight: 0.48, quantity: 8, unit: 'pcs', emoji: '🥚', shelf: 'door', expiryDate: new Date(Date.now() + 18 * 86400000) },
  { name: 'Orange Juice', category: 'beverage', weight: 1.0, emoji: '🍊', shelf: 'door', expiryDate: new Date(Date.now() + 7 * 86400000) },
  { name: 'Chicken Breast', category: 'meat', weight: 0.6, emoji: '🍗', shelf: 'bottom', expiryDate: new Date(Date.now() + 2 * 86400000) },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await SensorReading.deleteMany({});
    await FoodItem.deleteMany({});
    await Alert.deleteMany({});

    // Create user
    const user = await User.create(sampleUser);
    console.log('✅ Demo user created:', sampleUser.email);

    // Create 24h of sensor readings (one per hour)
    const readings = [];
    for (let i = 23; i >= 0; i--) {
      const time = new Date(Date.now() - i * 60 * 60 * 1000);
      const tempSpike = i === 18 ? 2.5 : 0; // spike 6hrs ago
      readings.push({
        userId: user._id,
        fridgeId: user.fridgeId,
        temperature: parseFloat((3.4 + Math.random() * 0.4 - 0.2 + tempSpike).toFixed(1)),
        humidity: parseFloat((68 + Math.random() * 4 - 2).toFixed(1)),
        weightTotal: 4.2,
        motionDetected: Math.random() > 0.8,
        distanceTop: 29,    // ~42% full
        distanceBottom: 10, // ~80% full
        fullnessTop: 42,
        fullnessBottom: 80,
        timestamp: time
      });
    }
    await SensorReading.insertMany(readings);
    console.log('✅ 24 sensor readings created');

    // Create food items
    const foods = await FoodItem.insertMany(foodItems.map(f => ({ ...f, userId: user._id })));
    console.log('✅ Food items created:', foods.length);

    // Create alerts
    await Alert.insertMany([
      { userId: user._id, type: 'expiry', severity: 'danger', title: 'Leftover Curry expires tomorrow', message: 'Use immediately or discard.', source: 'Food Tracker', relatedFood: foods[1]._id },
      { userId: user._id, type: 'expiry', severity: 'warning', title: 'Milk expires in 2 days', message: 'Consider using milk soon.', source: 'Gemini AI', relatedFood: foods[0]._id },
      { userId: user._id, type: 'storage', severity: 'warning', title: 'Bottom shelf 80% full', message: 'Consider reorganising items for airflow.', source: 'Ultrasonic Sensor' },
      { userId: user._id, type: 'temperature', severity: 'info', title: 'Temperature stabilised', message: 'Temp briefly rose to 5.9°C and is now back to 3.4°C.', source: 'DHT22' },
    ]);
    console.log('✅ Sample alerts created');

    console.log('\n🎉 Seed complete!');
    console.log('Login: demo@smartfridge.com / demo1234');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
