const CryptoData = require('../models/CryptoData');
const axios = require('axios');

// Get all available cryptocurrencies
exports.getAvailableCryptos = async (req, res) => {
  try {
    // Get unique crypto symbols from the database
    const cryptos = await CryptoData.distinct('symbol');

    // Add additional info for each cryptocurrency
    const cryptoList = cryptos.map(symbol => {
      const name = getCryptoName(symbol);
      return {
        symbol,
        name,
        imageUrl: `https://cryptologos.cc/logos/${name.toLowerCase().replace(/\s/g, '-')}-${symbol.toLowerCase()}-logo.png`
      };
    });

    return res.status(200).json({
      success: true,
      data: cryptoList
    });
  } catch (error) {
    console.error('Error fetching available cryptocurrencies:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get historical data for a specific cryptocurrency
exports.getCryptoHistoricalData = async (req, res) => {
  try {
    const { symbol, days = 30 } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a cryptocurrency symbol'
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Query database for historical data
    const historicalData = await CryptoData.find({
      symbol: symbol.toUpperCase(),
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    if (historicalData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No historical data found for this cryptocurrency'
      });
    }

    return res.status(200).json({
      success: true,
      count: historicalData.length,
      data: historicalData
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get latest price for one or more cryptocurrencies
exports.getLatestPrices = async (req, res) => {
  try {
    const { symbols, days = 7 } = req.query;
    
    // Validate input
    if (!symbols) {
      return res.status(400).json({ message: 'Please provide cryptocurrency symbols' });
    }
    
    // Convert symbols to array if it's a string
    const symbolsArray = Array.isArray(symbols) ? symbols : symbols.split(',');
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Find price data for the specified cryptocurrencies and date range
    const priceData = await CryptoData.find({
      symbol: { $in: symbolsArray },
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: 1 })
    .select('symbol date open high low close volume');
    
    // Group data by symbol for easier consumption by the frontend
    const groupedData = {};
    symbolsArray.forEach(symbol => {
      groupedData[symbol] = priceData.filter(data => data.symbol === symbol);
    });
    
    res.json(groupedData);
  } catch (error) {
    console.error('Error in /prices route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// async (req, res) => {
//   try {
//     const { symbols } = req.query;

//     if (!symbols) {
//       return res.status(400).json({
//         success: false,
//         error: 'Please provide cryptocurrency symbols'
//       });
//     }

//     const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());

//     // Get latest prices from database
//     const latestPrices = await Promise.all(
//       symbolArray.map(async (symbol) => {
//         const data = await CryptoData.findOne({ symbol })
//           .sort({ timestamp: -1 })
//           .limit(1);

//         return data ? {
//           symbol,
//           price: data.price,
//           timestamp: data.timestamp,
//           change24h: data.change24h || 0
//         } : null;
//       })
//     );

//     // Filter out null results
//     const validPrices = latestPrices.filter(price => price !== null);

//     if (validPrices.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'No price data found for the requested cryptocurrencies'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: validPrices
//     });
//   } catch (error) {
//     console.error('Error fetching latest prices:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Server error'
//     });
//   }
// };

// Update cryptocurrency data from external API
exports.updateCryptoData = async (req, res) => {
  try {
    // This would normally be a protected admin route
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to perform this action'
      });
    }

    // Trigger the data update script
    const result = await updateCryptoDataFromAPI();

    return res.status(200).json({
      success: true,
      message: 'Cryptocurrency data updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating cryptocurrency data:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Helper function to update crypto data
async function updateCryptoDataFromAPI() {
  try {
    // List of top cryptocurrencies to fetch
    const symbols = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'BNB', 'XLM'];
    const results = [];

    for (const symbol of symbols) {
      // Fetch data from CoinGecko API
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${getCoinGeckoId(symbol)}`, {
        params: {
          localization: false,
          tickers: false,
          community_data: false,
          developer_data: false
        }
      });

      const data = response.data;

      // Prepare data for database
      const cryptoData = {
        symbol: symbol,
        name: data.name,
        price: data.market_data.current_price.usd,
        marketCap: data.market_data.market_cap.usd,
        volume: data.market_data.total_volume.usd,
        change24h: data.market_data.price_change_percentage_24h,
        timestamp: new Date()
      };

      // Update or create data entry
      const result = await CryptoData.findOneAndUpdate(
        { symbol, timestamp: { $gte: new Date(Date.now() - 3600000) } }, // Last hour
        cryptoData,
        { upsert: true, new: true }
      );

      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Error in updateCryptoDataFromAPI:', error);
    throw error;
  }
}

// Helper function to get CoinGecko ID from symbol
function getCoinGeckoId(symbol) {
  const mapping = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'XRP': 'ripple',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'ADA': 'cardano',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'BNB': 'binancecoin',
    'XLM': 'stellar'
  };

  return mapping[symbol] || symbol.toLowerCase();
}

// Helper function to get cryptocurrency name from symbol
function getCryptoName(symbol) {
  const mapping = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'XRP': 'Ripple',
    'LTC': 'Litecoin',
    'BCH': 'Bitcoin Cash',
    'ADA': 'Cardano',
    'DOT': 'Polkadot',
    'LINK': 'Chainlink',
    'BNB': 'Binance Coin',
    'XLM': 'Stellar'
  };

  return mapping[symbol] || symbol;
}


exports.getTopCryptocurrency = async (req, res) => {
  try {
    const { limit = 6, sortBy = 'volume' } = req.query;

    // Get the most recent date in the database
    const latestEntry = await CryptoData.findOne().sort({ date: -1 });

    if (!latestEntry) {
      return res.status(404).json({ message: 'No cryptocurrency data found' });
    }

    const latestDate = latestEntry.date;

    // Find the top cryptocurrencies based on the latest date
    const topCryptos = await CryptoData.find({
      date: { $gte: new Date(latestDate.getTime() - 24 * 60 * 60 * 1000) }
    })
      .sort({ [sortBy]: -1 })
      .limit(parseInt(limit))
      .select('symbol open high low close volume date');

    res.json(topCryptos);
  } catch (error) {
    console.error('Error in /top route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDetail=async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 30 } = req.query;
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Find data for the specified cryptocurrency and date range
    const cryptoData = await CryptoData.find({
      symbol: symbol.toUpperCase(),
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: 1 })
    .select('symbol date open high low close volume');
    
    if (cryptoData.length === 0) {
      return res.status(404).json({ message: `No data found for ${symbol}` });
    }
    
    res.json(cryptoData);
  } catch (error) {
    console.error('Error in /detail route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};