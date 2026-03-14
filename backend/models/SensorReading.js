const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fridgeId: { type: String, required: true },
  temperature: { type: Number, required: true },       // DHT22 - Celsius
  humidity: { type: Number, required: true },           // DHT22 - Percentage
  weightTotal: { type: Number, default: 0 },            // HX711 - kg
  motionDetected: { type: Boolean, default: false },    // HC-SR501 PIR
  distanceTop: { type: Number, default: null },         // HC-SR04 - cm (top compartment)
  distanceBottom: { type: Number, default: null },      // HC-SR04 - cm (bottom compartment)
  fullnessTop: { type: Number, default: 0 },            // Calculated % fullness top shelf
  fullnessBottom: { type: Number, default: 0 },         // Calculated % fullness bottom shelf
  timestamp: { type: Date, default: Date.now }
});

// Index for fast time-based queries
sensorReadingSchema.index({ userId: 1, timestamp: -1 });
sensorReadingSchema.index({ fridgeId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
