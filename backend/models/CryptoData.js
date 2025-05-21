const mongoose = require('mongoose');

const CryptoDataSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  open: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  },
  low: {
    type: Number,
    required: true
  },
  close: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  }
});

// Create a compound index for efficient queries
CryptoDataSchema.index({ symbol: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CryptoData', CryptoDataSchema);