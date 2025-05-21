const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  predictedPrice: {
    type: Number,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  actualPrice: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prediction', PredictionSchema);