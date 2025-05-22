const express = require('express');
const router = express.Router();
const { 
  getAvailableCryptos, 
  getCryptoHistoricalData, 
  getLatestPrices,
  updateCryptoData,
  getTopCryptocurrency,
  getDetail
} = require('../controllers/cryptoController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/available', getAvailableCryptos);
router.get('/historical/:symbol/:days', getCryptoHistoricalData);
router.get('/prices', getLatestPrices);
router.get('/top',getTopCryptocurrency);
router.get('/detail/:symbol',getDetail)

// Protected admin routes
router.post('/update', protect, authorize, updateCryptoData);

module.exports = router;